from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pathlib import Path
from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import List, Optional
from datetime import datetime
import uvicorn
import multiprocessing
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_async_db, engine, Base
import models
from services.solicitud_service import SolicitudService
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from auth.auth_service import AuthService
from auth.auth_dependencies import get_current_user
from models import User
from contextlib import asynccontextmanager

# Obtén la ruta absoluta del directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manejador del ciclo de vida de la aplicación.
    Se ejecuta al iniciar y detener la aplicación.
    """
    # Código que se ejecuta al iniciar
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield

# Creamos la aplicación FastAPI una sola vez
app = FastAPI(
    title='Formulario de alta de nuevos clientes',
    lifespan=lifespan
)

# En desarrollo mantenemos CORS para trabajar con el servidor de desarrollo de React
# En producción no será necesario ya que todo se sirve desde el mismo origen
if app.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['http://localhost:3000'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )

# Definición de enumeraciones fijas
class TipoCarga(str, Enum):
    COMP = 'COMP'
    CROSS = 'CROSS'
    EXW = 'EXW'
    GRUP = 'GRUP'
    TTPRO = 'TTPRO'

# Modelos de datos usando Pydantic
class DatosComercial(BaseModel):
    """Datos que debe completar el comercial"""
    nombre: str
    direccion: str
    poblacion: str
    codigo_postal: str
    nombre_contacto: str
    telefono: str
    correo: EmailStr
    cif_nif: str
    tipo_carga: TipoCarga
    sepa_documento: str

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Empresa Example SL",
                "nombre_comercial": "Example",
                "direccion": "Calle Principal 123",
                "poblacion": "Valencia",
                "codigo_postal": "46001",
                "nombre_contacto": "Juan Pérez",
                "telefono": "960000000",
                "correo": "contacto@example.com",
                "web": "www.example.com",
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
    """Modelo principal que mantiene el estado de la solicitud"""
    id: str
    datos_comercial: Optional[DatosComercial]  # Corregido el nombre del campo
    estado: EstadoSolicitud
    fecha_creacion: datetime
    ultima_modificacion: datetime
    aprobado_director: bool = False
    aprobado_pedidos: bool = False
    aprobado_admin: bool = False
    notas: Optional[str] = None

# Endpoints de la API
# Modificar el endpoint de creación de solicitud para usar la base de datos
@app.post('/api/solicitudes/', response_model=SolicitudCliente)
async def crear_solicitud(datos: DatosComercial, db: AsyncSession = Depends(get_async_db)):
    """Crear una nueva solicitud por parte del comercial"""
    # Crear una nueva solicitud usando el modelo SQLAlchemy
    nueva_solicitud = models.SolicitudCliente(
        datos_comercial=datos.dict(),
        estado=EstadoSolicitud.PENDIENTE_DIRECTOR,
        notas=""
    )
    
    # Añadir y guardar en la base de datos
    db.add(nueva_solicitud)
    await db.commit()
    await db.refresh(nueva_solicitud)
    
    return nueva_solicitud  

@app.get('/api/solicitudes/{solicitud_id}', response_model=SolicitudCliente)
async def obtener_solicitud(solicitud_id: str, db: AsyncSession = Depends(get_async_db)):
    """Obtener el estado actual de una solicitud"""
    # Buscar la solicitud en la base de datos
    result = await db.execute(
        select(models.SolicitudCliente).where(models.SolicitudCliente.id == solicitud_id)
    )
    solicitud = result.scalar_one_or_none()
    
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    return solicitud

@app.put('/api/solicitudes/{solicitud_id}/director')
async def aprobar_director(
    solicitud_id: str, 
    aprobar: bool = True, 
    db: AsyncSession = Depends(get_async_db)
):
    """Aprobación del director comercial"""
    # Buscar la solicitud en la base de datos
    result = await db.execute(
        select(models.SolicitudCliente).where(models.SolicitudCliente.id == solicitud_id)
    )
    solicitud = result.scalar_one_or_none()
    
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    # Actualizar los campos
    solicitud.aprobado_director = aprobar
    solicitud.ultima_modificacion = datetime.now()
    solicitud.estado = (
        EstadoSolicitud.PENDIENTE_PEDIDOS if aprobar 
        else EstadoSolicitud.RECHAZADO
    )

    # Guardar los cambios
    await db.commit()

    return {'message': 'Solicitud actualizada'}

@app.post('/api/solicitudes/{solicitud_id}/archivar')
async def archivar_solicitud_endopoint(
    solicitud_id: UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endopoint para archivar la solicitud completada
    Solo accesible por el administrador.
    """
    servicio = SolicitudService(db)
    solicitud_archivada = await servicio.archivar_solicitud(solicitud_id)
    return {'message': 'Solicitud archivada correctamente'}

@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db)
):
    """Endpoint para iniciar sesión y obtener token JWT."""
    auth_service = AuthService(db)
    auth_response = await auth_service.authenticate_user(
        form_data.username,
        form_data.password
    )
    # No necesitamos modificar la respuesta porque auth_service ya 
    # devuelve el formato correcto
    return auth_response

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Endpoint protegido que requiere autenticación."""
    return current_user

# Ruta para servir el index.html de React
@app.get("/")
async def read_root():
    """
    Sirve el archivo index.html de la aplicación React
    Esta ruta es necesaria para manejar el enrutamiento del lado del cliente
    """
    return FileResponse(str(BASE_DIR / "static" / "index.html"))

# Configuración para servir archivos estáticos
# El orden de las rutas es crucial para el correcto funcionamiento
# Primero montamos los archivos estáticos específicos usando una ruta absoluta
app.mount(
    "/static", 
    StaticFiles(directory=str(BASE_DIR / "static")), # Apunta al directorio static en la raíz
    name="static"
)

# Luego montamos la raíz para manejar el enrutamiento de React
# También usando la ruta absoluta
app.mount(
    "/", 
    StaticFiles(directory=str(BASE_DIR / "static"), html=True), 
    name="root"
)

if __name__ == '__main__':
    # Creamos una configuración personalizada para uvicorn
    # Esta configuración nos permite especificar todos los parámetros que necesitamos
    # de una manera que funciona bien con la recarga automática
    config = uvicorn.Config(
        "app:app",          # Esta es la ruta de importación a la aplicación
                           # "app:app" significa "del módulo app, importa la variable app"
        host="0.0.0.0",    # Permite conexiones desde cualquier IP
        port=8000,         # Puerto en el que se ejecutará el servidor
        reload=True,       # Habilita la recarga automática cuando el código cambia
        log_level="debug", # Muestra logs detallados para debugging
        workers=1          # Número de procesos worker, 1 es suficiente para desarrollo
    )
    
    # Creamos y ejecutamos el servidor con la configuración anterior
    server = uvicorn.Server(config)
    server.run()