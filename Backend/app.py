import sys
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pathlib import Path
from pydantic import BaseModel, EmailStr, ValidationError
from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
import uuid
import logging
import traceback
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_async_db, engine, Base, verify_database_connection, init_db
import models
from services.solicitud_service import SolicitudService
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from auth.auth_service import AuthService
from auth.auth_dependencies import get_current_user
from models import User, EstadoSolicitud
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
        # Inicializar la base de datos al inicio
        await init_db()
        
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

class MetodoPago(str, Enum):
    REMESA = 'REMESA'
    TRANSFERENCIA = 'TRANSFERENCIA'

class DatosComercial(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    poblacion: Optional[str] = None
    codigo_postal: Optional[str] = None
    nombre_contacto: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    cif_nif: Optional[str] = None
    tipo_carga: Optional[TipoCarga] = None
    metodo_pago: Optional[MetodoPago] = None
    sepa_documento: Optional[str] = None

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

# Endpoints para solicitudes
@app.post('/api/solicitudes/')
async def crear_solicitud(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Crear una nueva solicitud"""
    try:
        # Obtener el cuerpo de la petición en bruto
        body = await request.body()
        logger.info(f"Datos recibidos en bruto: {body.decode('utf-8')}")
        
        # Analizar como JSON
        try:
            datos_json = json.loads(body.decode('utf-8'))
            logger.info(f"Datos como JSON: {datos_json}")
            
            # Mapeo de nombres de campos de camelCase a snake_case
            campo_mapping = {
                "codigoPostal": "codigo_postal",
                "nombreContacto": "nombre_contacto",
                "tipoCarga": "tipo_carga",
                "metodoPago": "metodo_pago",
                "sepaDocumento": "sepa_documento"
            }
            
            # Aplicar mapeo
            datos_mapeados = {}
            for key, value in datos_json.items():
                if key in campo_mapping:
                    datos_mapeados[campo_mapping[key]] = value
                else:
                    datos_mapeados[key] = value
                    
            logger.info(f"Datos mapeados: {datos_mapeados}")
            
            # Validar con Pydantic
            datos = DatosComercial(**datos_mapeados)
            logger.info(f"Datos validados: {datos.dict()}")
            
        except json.JSONDecodeError:
            logger.error("No se pudo decodificar el cuerpo como JSON")
            return JSONResponse(
                status_code=422,
                content={"detail": "Error al decodificar JSON"}
            )
        except ValidationError as ve:
            logger.error(f"Error de validación Pydantic: {ve}")
            return JSONResponse(
                status_code=422,
                content={"detail": f"Error de validación: {str(ve)}"}
            )
        
        # Validación para el documento SEPA
        if datos.metodo_pago == MetodoPago.REMESA and not datos.sepa_documento:
            logger.error("Se requiere documento SEPA para el método de pago REMESA")
            raise HTTPException(
                status_code=400,
                detail="Se requiere documento SEPA para el método de pago REMESA"
            )
            
        nueva_solicitud = models.Solicitud(
            comercial_id=current_user.id,
            datos_cliente=datos.dict(),
            estado=EstadoSolicitud.PENDIENTE_DIRECTOR,
            notas={}
        )
        
        logger.info(f"Creando solicitud para: {nueva_solicitud.datos_cliente}")
        
        db.add(nueva_solicitud)
        await db.commit()
        await db.refresh(nueva_solicitud)
        
        logger.info(f"Solicitud creada con ID: {nueva_solicitud.id}")
        
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
    except HTTPException as he:
        logger.error(f"HTTPException: {he.detail}")
        await db.rollback()
        raise he
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear solicitud: {str(e)}")
        logger.error(f"Tipo de excepción: {type(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la solicitud: {str(e)}"
        )

@app.get('/api/solicitudes/pendientes/{rol}')
async def obtener_solicitudes_pendientes_por_rol(
    rol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtener solicitudes pendientes según el rol"""
    try:
        if current_user.rol != rol:
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para ver estas solicitudes"
            )

        estado_buscar = None
        if rol == "director":
            estado_buscar = EstadoSolicitud.PENDIENTE_DIRECTOR
        elif rol == "pedidos":
            estado_buscar = EstadoSolicitud.PENDIENTE_PEDIDOS
        elif rol == "admin":
            estado_buscar = EstadoSolicitud.PENDIENTE_ADMIN
        else:
            raise HTTPException(status_code=400, detail="Rol no válido")

        result = await db.execute(
            select(models.Solicitud)
            .where(models.Solicitud.estado == estado_buscar)
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener solicitudes: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener las solicitudes"
        )

@app.get('/api/solicitudes/pendientes/{rol}')
async def obtener_solicitudes_pendientes_por_rol(
    rol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtener solicitudes pendientes según el rol"""
    try:
        logger.info(f"Obteniendo solicitudes pendientes para rol: {rol}")
        logger.info(f"Usuario actual: {current_user.email}, rol: {current_user.rol}")
        
        if current_user.rol != rol:
            logger.warning(f"El usuario {current_user.email} con rol {current_user.rol} intenta acceder a solicitudes de rol {rol}")
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para ver estas solicitudes"
            )

        estado_buscar = None
        if rol == "director":
            estado_buscar = EstadoSolicitud.PENDIENTE_DIRECTOR
        elif rol == "pedidos":
            estado_buscar = EstadoSolicitud.PENDIENTE_PEDIDOS
        elif rol == "admin":
            estado_buscar = EstadoSolicitud.PENDIENTE_ADMIN
        else:
            raise HTTPException(status_code=400, detail="Rol no válido")
            
        logger.info(f"Buscando solicitudes con estado: {estado_buscar}")

        result = await db.execute(
            select(models.Solicitud)
            .where(models.Solicitud.estado == estado_buscar)
            .order_by(models.Solicitud.creado_en.desc())
        )
        solicitudes = result.scalars().all()
        
        logger.info(f"Encontradas {len(solicitudes)} solicitudes pendientes")
        
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener solicitudes: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener las solicitudes"
        )
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

@app.get('/api/solicitudes/resumen')
async def obtener_resumen_solicitudes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtener resumen de solicitudes para el dashboard"""
    try:
        # Obtener todas las solicitudes asociadas al usuario, sin incluir fecha_aprobacion
        result = await db.execute(
            select(
                models.Solicitud.id,
                models.Solicitud.comercial_id,
                models.Solicitud.datos_cliente,
                models.Solicitud.estado,
                models.Solicitud.aprobado_director,
                models.Solicitud.aprobado_pedidos,
                models.Solicitud.aprobado_admin,
                models.Solicitud.notas,
                models.Solicitud.creado_en,
                models.Solicitud.actualizado_en
            )
            .where(models.Solicitud.comercial_id == current_user.id)
        )
        solicitudes = result.all()

        # Contar solicitudes por estado
        pendientes = sum(1 for s in solicitudes if s.estado in [
            EstadoSolicitud.PENDIENTE_DIRECTOR,
            EstadoSolicitud.PENDIENTE_PEDIDOS,
            EstadoSolicitud.PENDIENTE_ADMIN
        ])
        completadas = sum(1 for s in solicitudes if s.estado == EstadoSolicitud.COMPLETADO)
        rechazadas = sum(1 for s in solicitudes if s.estado == EstadoSolicitud.RECHAZADO)

        return {
            "pendientes": pendientes,
            "completadas": completadas,
            "rechazadas": rechazadas
        }
    except Exception as e:
        logger.error(f"Error al obtener resumen: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener el resumen de solicitudes"
        )

# También modifica la función obtener_solicitudes_usuario:
@app.get('/api/solicitudes/usuario/{email}')
async def obtener_solicitudes_usuario(
    email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtener solicitudes de un usuario"""
    try:
        # Si el usuario es director, pedidos o admin, mostrar solicitudes pendientes según su rol
        if current_user.rol in ["director", "pedidos", "admin"]:
            estado_buscar = None
            if current_user.rol == "director":
                estado_buscar = EstadoSolicitud.PENDIENTE_DIRECTOR
            elif current_user.rol == "pedidos":
                estado_buscar = EstadoSolicitud.PENDIENTE_PEDIDOS
            elif current_user.rol == "admin":
                estado_buscar = EstadoSolicitud.PENDIENTE_ADMIN

            result = await db.execute(
                select(
                    models.Solicitud.id,
                    models.Solicitud.comercial_id,
                    models.Solicitud.datos_cliente,
                    models.Solicitud.estado, 
                    models.Solicitud.aprobado_director,
                    models.Solicitud.aprobado_pedidos,
                    models.Solicitud.aprobado_admin,
                    models.Solicitud.notas,
                    models.Solicitud.creado_en,
                    models.Solicitud.actualizado_en
                )
                .where(models.Solicitud.estado == estado_buscar)
                .order_by(models.Solicitud.creado_en.desc())
            )
        else:
            # Para los comerciales, mostrar sus propias solicitudes
            result = await db.execute(
                select(
                    models.Solicitud.id,
                    models.Solicitud.comercial_id,
                    models.Solicitud.datos_cliente,
                    models.Solicitud.estado, 
                    models.Solicitud.aprobado_director,
                    models.Solicitud.aprobado_pedidos,
                    models.Solicitud.aprobado_admin,
                    models.Solicitud.notas,
                    models.Solicitud.creado_en,
                    models.Solicitud.actualizado_en
                )
                .where(models.Solicitud.comercial_id == current_user.id)
                .order_by(models.Solicitud.creado_en.desc())
            )
            
        solicitudes = result.all()
        
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