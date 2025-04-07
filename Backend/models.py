# models.py
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base
from enum import Enum as PyEnum

class UserRole(PyEnum):
    comercial = "comercial"
    director = "director"
    pedidos = "pedidos"
    admin = "admin"

class EstadoSolicitud(PyEnum):
    PENDIENTE_DIRECTOR = "PENDIENTE_DIRECTOR"
    PENDIENTE_PEDIDOS = "PENDIENTE_PEDIDOS"
    PENDIENTE_ADMIN = "PENDIENTE_ADMIN"
    COMPLETADO = "COMPLETADO"
    RECHAZADO = "RECHAZADO"

class Solicitud(Base):
    __tablename__ = "solicitudes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comercial_id = Column(UUID(as_uuid=True), nullable=False)
    datos_cliente = Column(String, nullable=False)
    estado = Column(Enum(EstadoSolicitud), nullable=False)
    aprobado_director = Column(Boolean, default=False)
    aprobado_pedidos = Column(Boolean, default=False)
    aprobado_admin = Column(Boolean, default=False)
    notas = Column(String, default="{}")
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), onupdate=func.now())

class SolicitudArchivada(Base):
    __tablename__ = "solicitudes_archivadas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solicitud_original_id = Column(UUID(as_uuid=True), nullable=False)
    resumen = Column(String, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), nullable=False)
    fecha_aprobacion_director = Column(DateTime(timezone=True))
    fecha_aprobacion_pedidos = Column(DateTime(timezone=True))
    fecha_aprobacion_admin = Column(DateTime(timezone=True))
    comercial_email = Column(String, nullable=False)
    cliente_nombre = Column(String, nullable=False)

class User(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre_completo = Column(String, nullable=False)
    rol = Column(Enum(UserRole), nullable=False)
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime(timezone=True))
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    is_temporary_password = Column(Boolean, default=False)  # Nuevo campo para contraseñas temporales