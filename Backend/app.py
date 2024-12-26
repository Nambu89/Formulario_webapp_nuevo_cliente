from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import List, Optional
from datetime import datetime
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['http://localhost:3000'], # URL de la app frontend
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*']
)

# Montamos los archivos estáticos del frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")

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
        schema_extra = {
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
    estado: EstadoSolicitud
    fecha_creacion: datetime
    ultima_modificacion: datetime
    aprobado_director: bool = False
    aprobado_pedidos: bool = False
    aprobado_admin: bool = False
    notas: Optional[str]

# Inicialización de la aplicación FastAPI
app = FastAPI(title = 'Formulario de alta de nuevos clientes')

# Almacenamiento temporal
solicitudes_db = {}

# Endpoints de la API
@app.post('/solicitudes/', response_model = SolicitudCliente)
async def crear_solicitud(datos: DatosComercial):
    """Crear una nueva solicitud por parte del comercial"""
    solicitud_id = str(len(solicitudes_db) + 1) # En PROD usar UUID
    nueva_solicitud = SolicitudCliente(
        id = solicitud_id,
        datos_comerecial = datos,
        estado= EstadoSolicitud.PENDIENTE_DIRECTOR,
        fecha_creacion = datetime.now(),
        ultima_modificacion = datetime.now()
    )
    solicitudes_db[solicitud_id] = nueva_solicitud
    return nueva_solicitud

@app.get('/solicitudes/{solicitud_id}', response_model = SolicitudCliente)
async def obtener_solicitud(solicitud_id: str):
    """Obtener el estado actual de una solicitud"""
    if solicitud_id not in solicitudes_db:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return solicitudes_db[solicitud_id]

@app.put('/solicitudes/{solicitud_id}/director')
async def aprobar_director(solicitud_id: str, aprobar: bool = True):
    """Aprobación del director comercial"""
    if solicitud_id not in solicitudes_db:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    solicitud = solicitudes_db[solicitud_id]
    solicitud.aprobado_director = aprobar
    solicitud.ultima_modificacion = datetime.now()
    
    if aprobar:
        solicitud.estado = EstadoSolicitud.PENDIENTE_PEDIDOS
    else:
        solicitud.estado = EstadoSolicitud.RECHAZADO
    
    return {"message": "Solicitud actualizada"}

if __name__ == '__main__':
    uvicorn.run(app, host = '0.0.0.0', port = 8000, debug = True)