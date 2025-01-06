from sqlalchemy import Boolean, Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    comercial = "comercial"
    director = "director"
    pedidos = "pedidos"
    admin = "admin"

class User(Base):
    """Modelo para la autenticación y gestión de usuarios"""
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre_completo = Column(String, nullable=False)
    rol = Column(Enum(UserRole), nullable=False)
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime(timezone=True))
    creado_en = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relación con las solicitudes creadas por este usuario
    solicitudes = relationship("Solicitud", back_populates="comercial")

class EstadoSolicitud(str, enum.Enum):
    PENDIENTE_DIRECTOR = "pendiente_director"
    PENDIENTE_PEDIDOS = "pendiente_pedidos"
    PENDIENTE_ADMIN = "pendiente_admin"
    COMPLETADO = "completado"
    RECHAZADO = "rechazado"

class Solicitud(Base):
    """Modelo para las solicitudes de alta de nuevos clientes"""
    __tablename__ = "solicitudes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Relación con el comercial que creó la solicitud
    comercial_id = Column(UUID(as_uuid=True), ForeignKey('usuarios.id'), nullable=False)
    comercial = relationship("User", back_populates="solicitudes")
    
    # Datos del cliente almacenados como JSON
    datos_cliente = Column(JSONB, nullable=False)
    
    # Estado y aprobaciones
    estado = Column(Enum(EstadoSolicitud), nullable=False)
    aprobado_director = Column(Boolean, default=False)
    aprobado_pedidos = Column(Boolean, default=False)
    aprobado_admin = Column(Boolean, default=False)
    
    # Campo para notas de cada departamento
    notas = Column(JSONB, default={})
    
    # Campos de auditoría
    creado_en = Column(DateTime(timezone=True), default=datetime.utcnow)
    actualizado_en = Column(DateTime(timezone=True), onupdate=datetime.utcnow)

class SolicitudArchivada(Base):
    """
    Modelo para archivar el registro históricos de solicitudes completadas
    de manera mas eficiente en espacio
    """
    __tablename__ = 'solicitudes_archivadas'

    id = Column(UUID(as_uuid = True), primary_key = True, default = uuid.uuid4)
    solicitud_original_id = Column(UUID(as_uuid = True), nullable = False)

    # Datos comprimidos de la solicitud original
    resumen = Column(JSONB, nullable = False)

    # Fechas importantes del proceso
    fecha_creacion = Column(DateTime(timezone = True), nullable = False)
    fecha_aprobacion_director = Column(DateTime(timezone = True))
    fecha_aprobacion_pedidos = Column(DateTime(timezone = True))
    fecha_aprobacion_admin = Column(DateTime(timezone = True))
    fecha_archivado = Column(DateTime(timezone = True), default = datetime.utcnow)

    # Metadata importante
    comercial_email = Column(String, nullable = False)
    cliente_nombre = Column(String, nullable = False)