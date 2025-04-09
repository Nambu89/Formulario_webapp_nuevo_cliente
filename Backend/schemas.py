# schemas.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum

class TipoCarga(str, Enum):
    COMP = 'COMP'
    CROSS = 'CROSS'
    GRUP = 'GRUP'
    TTPRO = 'TTPRO'

class MetodoPago(str, Enum):
    TRANSFERENCIA = 'TRANSFERENCIA'
    RECIBO = 'RECIBO'
    RECIBO_B2B = 'RECIBO B2B'
    CONF_CLIENTE = 'CONF. CLIENTE'
    CREDITO = 'CRÉDITO'

class UserRole(str, Enum):
    comercial = "comercial"
    director = "director"
    pedidos = "pedidos"
    admin = "admin"

class SolicitudCreate(BaseModel):
    nombre: str
    direccion: str
    poblacion: str
    codigoPostal: str
    direccionEnvio: Optional[str] = None
    poblacionEnvio: Optional[str] = None
    codigoPostalEnvio: Optional[str] = None
    nombreContacto: str
    telefono: str
    correo: EmailStr
    cif_nif: str
    tipoCarga: TipoCarga
    metodoPago: MetodoPago
    solicitudCredito: Optional[float] = 0.0
    esAutonomo: bool
    documentos: Optional[Dict[str, Optional[str]]] = {}

    class Config:
        from_attributes = True

class SolicitudResponse(BaseModel):
    id: str
    datos_comercial: dict
    estado: str
    fecha_creacion: datetime
    ultima_modificacion: datetime
    aprobado_director: bool
    aprobado_pedidos: bool
    aprobado_admin: bool
    notas: Optional[Dict[str, str]] = {}

    class Config:
        from_attributes = True

# Nuevos esquemas para usuarios
class UserCreate(BaseModel):
    email: EmailStr
    nombre_completo: str
    rol: UserRole
    activo: bool = True

class UserUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    rol: Optional[UserRole] = None
    activo: Optional[bool] = None
    password: Optional[str] = None  # Para cambiar la contraseña

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    nombre_completo: str
    rol: str
    activo: bool
    ultimo_acceso: Optional[datetime] = None
    creado_en: datetime
    is_temporary_password: bool

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        # Convierte manualmente los campos problemáticos
        return cls(
            id=str(obj.id),  # Convertir UUID a string
            email=obj.email,
            nombre_completo=obj.nombre_completo,
            rol=obj.rol.value if hasattr(obj.rol, 'value') else str(obj.rol),  # Manejar Enum
            activo=obj.activo,
            ultimo_acceso=obj.ultimo_acceso,
            creado_en=obj.creado_en,
            is_temporary_password=obj.is_temporary_password
        )

class PasswordChange(BaseModel):
    current_password: str
    new_password: str