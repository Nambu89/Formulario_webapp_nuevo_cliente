import sys
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pathlib import Path
from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_async_db, engine, Base, verify_database_connection
import models
from services.solicitud_service import SolicitudService
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from auth.auth_service import AuthService
from auth.auth_dependencies import get_current_user
from models import User
from contextlib import asynccontextmanager
import asyncio

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtén la ruta absoluta del directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Asegúrate de que existe el directorio de uploads
UPLOAD_DIR = Path("uploads/sepa")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejador del ciclo de vida de la aplicación."""
    try:
        if not await verify_database_connection():
            raise Exception("No se pudo establecer la conexión inicial con la base de datos")
        
        logger.info("Inicialización de la aplicación completada")
        yield
    finally:
        await engine.dispose()
        logger.info("Recursos de la aplicación liberados correctamente")

app = FastAPI(
    title='Sistema de Alta de Nuevos Clientes',
    description='API para la gestión de altas de nuevos clientes',
    version='1.0.0',
    lifespan=lifespan
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Modelos Pydantic
class TipoCarga(str, Enum):
    COMP = 'COMP'
    CROSS = 'CROSS'
    EXW = 'EXW'
    GRUP = 'GRUP'
    TTPRO = 'TTPRO'

class DatosComercial(BaseModel):
    nombre: str
    direccion: str
    poblacion: str
    codigo_postal: str
    nombre_contacto: str
    telefono: str
    correo: EmailStr
    cif_nif: str
    tipo_carga: TipoCarga
    sepa_documento: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Empresa Example SL",
                "direccion": "Calle Principal 123",
                "poblacion": "Valencia",
                "codigo_postal": "46001",
                "nombre_contacto": "Juan Pérez",
                "telefono": "960000000",
                "correo": "contacto@example.com",
                "cif_nif": "B12345678",
                "tipo_carga": "COMP",
                "sepa_documento": "sepa_12345.pdf"
            }
        }

class EstadoSolicitud(str, Enum):
    PENDIENTE_DIRECTOR = 'pendiente_director'
    PENDIENTE_PEDIDOS = 'pendiente_pedidos'
    PENDIENTE_ADMIN = 'pendiente_admin'
    COMPLETADO = 'completado'
    RECHAZADO = 'rechazado'

class SolicitudCliente(BaseModel):
    id: str
    datos_comercial: Optional[DatosComercial]
    estado: EstadoSolicitud
    fecha_creacion: datetime
    ultima_modificacion: datetime
    aprobado_director: bool = False
    aprobado_pedidos: bool = False
    aprobado_admin: bool = False
    notas: Optional[Dict[str, Any]] = None

# Endpoints
@app.post('/api/upload/sepa')
async def upload_sepa(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Endpoint para subir documentos SEPA"""
    try:
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['pdf', 'doc', 'docx']:
            raise HTTPException(
                status_code=400,
                detail="Tipo de archivo no permitido. Solo se permiten PDF y documentos Word."
            )

        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / file_name
        
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        file_url = f"/uploads/sepa/{file_name}"
        
        return {
            "url": file_url,
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al subir archivo SEPA: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al procesar el archivo"
        )

@app.post('/api/solicitudes/')
async def crear_solicitud(
    datos: DatosComercial,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Crear una nueva solicitud"""
    try:
        nueva_solicitud = models.Solicitud(
            comercial_id=current_user.id,
            datos_cliente=datos.dict(),
            estado=EstadoSolicitud.PENDIENTE_DIRECTOR,
            notas={}
        )
        
        db.add(nueva_solicitud)
        await db.commit()
        await db.refresh(nueva_solicitud)
        
        return {
            "id": str(nueva_solicitud.id),
            "mensaje": "Solicitud creada exitosamente",
            "solicitud": {
                "id": str(nueva_solicitud.id),
                "datos_comercial": nueva_solicitud.datos_cliente,
                "estado": nueva_solicitud.estado,
                "fecha_creacion": nueva_solicitud.creado_en,
                "ultima_modificacion": nueva_solicitud.actualizado_en,
                "aprobado_director": nueva_solicitud.aprobado_director,
                "aprobado_pedidos": nueva_solicitud.aprobado_pedidos,
                "aprobado_admin": nueva_solicitud.aprobado_admin,
                "notas": nueva_solicitud.notas
            }
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear solicitud: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear la solicitud"
        )

@app.get('/api/solicitudes/usuario/{email}')
async def obtener_solicitudes_usuario(
    email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtener solicitudes de un usuario"""
    try:
        result = await db.execute(
            select(models.Solicitud)
            .where(models.Solicitud.comercial_id == current_user.id)
            .order_by(models.Solicitud.creado_en.desc())
        )
        solicitudes = result.scalars().all()
        
        return [
            {
                "id": str(solicitud.id),
                "datos_comercial": solicitud.datos_cliente,
                "estado": solicitud.estado,
                "fecha_creacion": solicitud.creado_en,
                "ultima_modificacion": solicitud.actualizado_en,
                "aprobado_director": solicitud.aprobado_director,
                "aprobado_pedidos": solicitud.aprobado_pedidos,
                "aprobado_admin": solicitud.aprobado_admin,
                "notas": solicitud.notas
            }
            for solicitud in solicitudes
        ]
    except Exception as e:
        logger.error(f"Error al obtener solicitudes: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener las solicitudes"
        )

@app.get('/api/solicitudes/{solicitud_id}')
async def obtener_solicitud(
    solicitud_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtener una solicitud específica"""
    result = await db.execute(
        select(models.Solicitud).where(models.Solicitud.id == solicitud_id)
    )
    solicitud = result.scalar_one_or_none()
    
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    return solicitud

@app.put('/api/solicitudes/{solicitud_id}/estado')
async def actualizar_estado_solicitud(
    solicitud_id: str,
    estado: EstadoSolicitud,
    notas: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Actualizar el estado de una solicitud"""
    result = await db.execute(
        select(models.Solicitud).where(models.Solicitud.id == solicitud_id)
    )
    solicitud = result.scalar_one_or_none()
    
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    solicitud.estado = estado
    if notas:
        solicitud.notas = {
            **solicitud.notas,
            current_user.rol: notas
        }
    solicitud.ultima_modificacion = datetime.utcnow()
    
    await db.commit()
    return {"message": "Estado actualizado correctamente"}

@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db)
):
    """Login y obtención de token JWT"""
    auth_service = AuthService(db)
    return await auth_service.authenticate_user(
        form_data.username,
        form_data.password
    )

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user

# Configuración de archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/", StaticFiles(directory=str(BASE_DIR / "static"), html=True), name="root")

# Ruta raíz para servir la aplicación React
@app.get("/")
async def read_root():
    return FileResponse(str(BASE_DIR / "static" / "index.html"))

if __name__ == '__main__':
    config = uvicorn.Config(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug",
        workers=1
    )
    
    server = uvicorn.Server(config)
    server.run()