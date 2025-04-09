# app.py
import sys
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from auth.auth_router import router as auth_router
from pathlib import Path
from pydantic import ValidationError
from typing import Optional, Dict, Any, List
from datetime import datetime
import uvicorn
import uuid
from uuid import UUID
import logging
import traceback
from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from database import get_db, engine, Base, verify_database_connection, init_db
import models
from schemas import SolicitudCreate, SolicitudResponse, UserCreate, UserUpdate, UserResponse, PasswordChange
from services.solicitud_service import SolicitudService
from auth.auth_service import AuthService
from auth.auth_handler import AuthHandler
from auth.auth_dependencies import get_current_user
from models import User, EstadoSolicitud
from contextlib import asynccontextmanager
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
import json
import uuid
from pathlib import Path

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtén la ruta absoluta del directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Asegúrate de que existe el directorio de uploads
UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejador del ciclo de vida de la aplicación."""
    try:
        init_db()
        if not verify_database_connection():
            raise Exception("No se pudo establecer la conexión inicial con la base de datos")
        logger.info("Inicialización de la aplicación completada")
        yield
    finally:
        engine.dispose()
        logger.info("Recursos de la aplicación liberados correctamente")

app = FastAPI(
    title='Sistema de Alta de Nuevos Clientes',
    description='API para la gestión de altas de nuevos clientes',
    version='1.0.0',
    lifespan=lifespan
)

app.include_router(auth_router)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Dependencia para obtener el AuthService
def get_auth_service(db: Session = Depends(get_db)):
    return AuthService(db, AuthHandler())

# Endpoint para la creación de solicitudes
@app.post('/api/solicitudes/', response_model=SolicitudResponse)
async def crear_solicitud(
    nombre: str = Form(...),
    direccion: str = Form(...),
    poblacion: str = Form(...),
    codigoPostal: str = Form(...),
    direccionEnvio: str = Form(None),
    poblacionEnvio: str = Form(None),
    codigoPostalEnvio: str = Form(None),
    nombreContacto: str = Form(...),
    telefono: str = Form(...),
    correo: str = Form(...),
    cif_nif: str = Form(...),
    tipoCarga: str = Form(...),
    metodoPago: str = Form(...),
    solicitudCredito: float = Form(0.0),
    esAutonomo: bool = Form(...),
    sepa: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear una nueva solicitud"""
    try:
        documentos = {}
        if sepa:
            file_extension = sepa.filename.split('.')[-1].lower()
            if file_extension not in ['pdf', 'doc', 'docx']:
                raise HTTPException(
                    status_code=400,
                    detail="Tipo de archivo no permitido. Solo se permiten PDF y documentos Word."
                )
            file_name = f"{uuid.uuid4()}.{file_extension}"
            file_path = UPLOAD_DIR / file_name
            content = await sepa.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            file_url = f"/uploads/documents/{file_name}"
            documentos['sepa'] = file_url

        solicitud_data = {
            "nombre": nombre,
            "direccion": direccion,
            "poblacion": poblacion,
            "codigoPostal": codigoPostal,
            "direccionEnvio": direccionEnvio,
            "poblacionEnvio": poblacionEnvio,
            "codigoPostalEnvio": codigoPostalEnvio,
            "nombreContacto": nombreContacto,
            "telefono": telefono,
            "correo": correo,
            "cif_nif": cif_nif,
            "tipoCarga": tipoCarga,
            "metodoPago": metodoPago,
            "solicitudCredito": solicitudCredito,
            "esAutonomo": esAutonomo,
            "documentos": documentos
        }
        logger.info(f"Datos recibidos para crear solicitud: {solicitud_data}")

        solicitud = SolicitudCreate(**solicitud_data)

        nueva_solicitud = models.Solicitud(
            comercial_id=current_user.id,
            datos_cliente=solicitud.dict(),
            estado=EstadoSolicitud.PENDIENTE_DIRECTOR,
            aprobado_director=False,
            aprobado_pedidos=False,
            aprobado_admin=False,
            notas={}
        )

        db.add(nueva_solicitud)
        db.commit()
        db.refresh(nueva_solicitud)

        logger.info(f"Solicitud creada con ID: {nueva_solicitud.id}")

        return {
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
    except HTTPException as he:
        logger.error(f"HTTPException: {he.detail}")
        db.rollback()
        raise he
    except ValidationError as ve:
        logger.error(f"Error de validación Pydantic: {ve}")
        db.rollback()
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear solicitud: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la solicitud: {str(e)}"
        )

# Endpoint para subir documentos (generalizado)
@app.post('/api/upload/documento')
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Endpoint para subir cualquier documento"""
    try:
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['pdf', 'doc', 'docx']:
            raise HTTPException(
                status_code=400,
                detail="Tipo de archivo no permitido. Solo se permiten PDF y documentos Word."
            )

        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / file_name
        
        content = file.file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        file_url = f"/uploads/documents/{file_name}"
        
        return {
            "url": file_url,
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al subir archivo: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al procesar el archivo"
        )

# Mantén el endpoint anterior por compatibilidad, pero redirige al nuevo
@app.post('/api/upload/sepa')
def upload_sepa(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    return upload_document(file, current_user)

# Endpoint para obtener solicitudes pendientes por rol
@app.get('/api/solicitudes/pendientes/{rol}', response_model=List[SolicitudResponse])
def obtener_solicitudes_pendientes_por_rol(
    rol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener solicitudes pendientes según el rol"""
    try:
        logger.info(f"Obteniendo solicitudes pendientes para rol: {rol}")
        
        if current_user.rol.value != rol and not current_user.rol.value == 'admin':
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

        result = db.execute(
            select(models.Solicitud)
            .where(models.Solicitud.estado == estado_buscar)
            .order_by(models.Solicitud.creado_en.desc())
        )
        solicitudes = result.scalars().all()
        
        logger.info(f"Encontradas {len(solicitudes)} solicitudes pendientes para el rol {rol}")
        
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
        logger.error(f"Error al obtener solicitudes pendientes: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Error al obtener las solicitudes pendientes"
        )

# Endpoint para aprobar/rechazar solicitudes
@app.put('/api/solicitudes/{solicitud_id}/aprobar')
def aprobar_rechazar_solicitud(
    solicitud_id: UUID,
    datos: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aprobar o rechazar una solicitud según el rol del usuario"""
    try:
        logger.info(f"Aprobar/rechazar solicitud {solicitud_id} por {current_user.email} con rol {current_user.rol}")
        logger.info(f"Datos recibidos: {datos}")
        
        result = db.execute(
            select(models.Solicitud).where(models.Solicitud.id == solicitud_id)
        )
        solicitud = result.scalar_one_or_none()
        
        if not solicitud:
            raise HTTPException(
                status_code=404,
                detail="Solicitud no encontrada"
            )
            
        if (current_user.rol == 'director' and solicitud.estado != EstadoSolicitud.PENDIENTE_DIRECTOR) or \
           (current_user.rol == 'pedidos' and solicitud.estado != EstadoSolicitud.PENDIENTE_PEDIDOS) or \
           (current_user.rol == 'admin' and solicitud.estado != EstadoSolicitud.PENDIENTE_ADMIN):
            raise HTTPException(
                status_code=400,
                detail=f"Esta solicitud no está pendiente para el rol {current_user.rol}"
            )
            
        aprobar = datos.get('aprobar', False)
        notas = datos.get('notas', '')
        
        if aprobar:
            if current_user.rol == 'director':
                marcas = datos.get('marcas', [])
                tarifa = datos.get('tarifa', '')
                if not marcas or not tarifa:
                    raise HTTPException(
                        status_code=400,
                        detail="Se requieren marcas y tarifa para aprobar la solicitud"
                    )
                if not solicitud.datos_cliente:
                    solicitud.datos_cliente = {}
                solicitud.datos_cliente['marcas_aprobadas'] = marcas
                solicitud.datos_cliente['tarifa_aprobada'] = tarifa
                solicitud.aprobado_director = True
                solicitud.estado = EstadoSolicitud.PENDIENTE_PEDIDOS
                if not solicitud.notas:
                    solicitud.notas = {}
                solicitud.notas['director'] = notas
                
            elif current_user.rol == 'pedidos':
                solicitud.aprobado_pedidos = True
                solicitud.estado = EstadoSolicitud.PENDIENTE_ADMIN
                if not solicitud.notas:
                    solicitud.notas = {}
                solicitud.notas['pedidos'] = notas
                
            elif current_user.rol == 'admin':
                termino_pago = datos.get('termino_pago', '')
                if not termino_pago:
                    raise HTTPException(
                        status_code=400,
                        detail="Se requiere término de pago para aprobar la solicitud"
                    )
                if not solicitud.datos_cliente:
                    solicitud.datos_cliente = {}
                solicitud.datos_cliente['termino_pago'] = termino_pago
                solicitud.aprobado_admin = True
                solicitud.estado = EstadoSolicitud.COMPLETADO
                if not solicitud.notas:
                    solicitud.notas = {}
                solicitud.notas['admin'] = notas
        else:
            solicitud.estado = EstadoSolicitud.RECHAZADO
            if not solicitud.notas:
                solicitud.notas = {}
            solicitud.notas[current_user.rol] = notas
            
        solicitud.actualizado_en = datetime.utcnow()
        db.commit()
        db.refresh(solicitud)
        
        logger.info(f"Solicitud {solicitud_id} actualizada con éxito. Nuevo estado: {solicitud.estado}")
        
        return {
            "id": str(solicitud.id),
            "estado": solicitud.estado,
            "mensaje": "Solicitud procesada correctamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al procesar solicitud: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la solicitud: {str(e)}"
        )

# Endpoint para obtener resumen de solicitudes
@app.get('/api/solicitudes/resumen')
def obtener_resumen_solicitudes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener resumen de solicitudes para el dashboard"""
    try:
        result = db.execute(
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

# Endpoint para obtener solicitudes por usuario
@app.get('/api/solicitudes/usuario/{email}', response_model=List[SolicitudResponse])
def obtener_solicitudes_usuario(
    email: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener solicitudes creadas por un usuario comercial"""
    try:
        logger.info(f"Obteniendo solicitudes para el usuario con email: {email}")
        
        result_user = db.execute(
            select(User).where(User.email == email)
        )
        user = result_user.scalar_one_or_none()
        
        if not user:
            logger.error(f"Usuario no encontrado: {email}")
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )
            
        if current_user.email != email and current_user.rol != 'admin':
            logger.warning(f"El usuario {current_user.email} intenta acceder a solicitudes de {email}")
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para ver estas solicitudes"
            )
            
        result = db.execute(
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
            .where(models.Solicitud.comercial_id == user.id)
            .order_by(models.Solicitud.creado_en.desc())
        )
        
        solicitudes = result.all()
        logger.info(f"Encontradas {len(solicitudes)} solicitudes para el usuario {email}")
        
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
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Error al obtener las solicitudes"
        )

# Endpoint para obtener información del usuario actual
@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return UserResponse.from_orm(current_user)

# Endpoint para actualizar el perfil del usuario actual
@app.put("/users/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Permite a un usuario actualizar su propio perfil"""
    try:
        # No permitir cambiar el rol ni el estado de actividad desde este endpoint
        if user_update.rol is not None or user_update.activo is not None:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para cambiar el rol o el estado de actividad"
            )

        return auth_service.update_user(str(current_user.id), user_update)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar perfil: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error al actualizar el perfil"
        )

# Endpoint para cambiar la contraseña del usuario actual
@app.post("/users/me/change-password")
def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Permite a un usuario cambiar su contraseña"""
    try:
        return auth_service.change_password(current_user, password_change)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al cambiar contraseña: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error al cambiar la contraseña"
        )

# Endpoint para obtener todos los usuarios (solo para admins)
@app.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Obtiene todos los usuarios (solo para admins)"""
    try:
        if current_user.rol != "admin":
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para ver todos los usuarios"
            )
        return auth_service.get_all_users()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener usuarios: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error al obtener los usuarios"
        )

# Endpoint para crear un nuevo usuario (solo para admins)
@app.post("/users", response_model=Dict[str, Any])
def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Crea un nuevo usuario (solo para admins)"""
    try:
        if current_user.rol != "admin":
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para crear usuarios"
            )
        return auth_service.create_user(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear usuario: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error al crear el usuario"
        )

# Endpoint para eliminar un usuario (solo para admins)
@app.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Elimina un usuario (solo para admins)"""
    try:
        if current_user.rol != "admin":
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para eliminar usuarios"
            )
        return auth_service.delete_user(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar usuario: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error al eliminar el usuario"
        )

# Endpoint para actualizar un usuario (solo para admins)
@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Actualiza un usuario (solo para admins)"""
    try:
        if current_user.rol != "admin":
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para actualizar usuarios"
            )
        return auth_service.update_user(user_id, user_update)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar usuario: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error al actualizar el usuario"
        )

# Configuración de archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/", StaticFiles(directory=str(BASE_DIR / "static"), html=True), name="root")

@app.get("/")
def read_root():
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