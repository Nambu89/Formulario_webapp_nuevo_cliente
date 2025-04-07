from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime
from models import Solicitud, SolicitudArchivada
from fastapi import HTTPException

class SolicitudService:
    def __init__(self, db = AsyncSession):
        self.db = db
    
    async def archivar_solicitud(self, solicitud_id = UUID):
        """
        Archiva una solicitud completada y la elimina de la tabla activa.
        
        Args:
            solicitud_id: UUID de la solicitud a archivar
            
        Raises:
            HTTPException: Si la solicitud no existe o no está lista para archivar
            
        Returns:
            SolicitudArchivada: El registro archivado de la solicitud
        """
        try:
            # Buscamos la solicitud original
            solicitud = await self.db.get(Solicitud, solicitud_id)

            # Verificamos que la solicitud existe y está lista para archivar
            if not solicitud:
                raise HTTPException(
                    status_code = 404,
                    detail = f'solicitud no encontrada'
                )
            
            if not all([
                solicitud.aprobado_director,
                solicitud.aprobado_pedidos,
                solicitud.aprobado_admin,
            ]):
                raise HTTPException(
                    status_code = 400,
                    detail = f'La solicitud no está lista para archivar'
                )
            
           # Creamos el registro archivado con el campo metodo_pago y fechas corregidas
            solicitud_archivada = SolicitudArchivada(
                solicitud_original_id = solicitud.id,
                resumen = {
                    'cliente': {
                        'nombre': solicitud.datos_cliente.get('nombre'),
                        'cif_nif': solicitud.datos_cliente.get('cif_nif'),
                        'tipo_carga': solicitud.datos_cliente.get('tipo_carga'),
                        'metodo_pago': solicitud.datos_cliente.get('metodo_pago'),
                    },
                    'proceso': {
                        'director': solicitud.notas.get('director'),
                        'pedidos': solicitud.notas.get('pedidos'),
                        'admin': solicitud.notas.get('admin'),
                    }
                },
                fecha_creacion = solicitud.creado_en,
                fecha_aprobacion_director = solicitud.fecha_aprobacion.get('director') if solicitud.fecha_aprobacion else None,
                fecha_aprobacion_pedidos = solicitud.fecha_aprobacion.get('pedidos') if solicitud.fecha_aprobacion else None,
                fecha_aprobacion_admin = solicitud.fecha_aprobacion.get('admin') if solicitud.fecha_aprobacion else None,
                comercial_email = solicitud.comercial.email,
                cliente_nombre = solicitud.datos_cliente.get('nombre')    
            )

            # Guardamos el archivo y eliminamos la solicitud original
            self.db.add(solicitud_archivada)
            await self.db.delete(solicitud)
            await self.db.commit()

            return solicitud_archivada

        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code = 500,
                detail = f'Error al archivar la solicitud: {str(e)}'
            )