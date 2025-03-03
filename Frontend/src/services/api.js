// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const clienteAPI = {
    // Crear nueva solicitud (usado por el comercial)
    async crearSolicitud(datosCliente) {
        const response = await fetch(`${API_BASE_URL}/api/solicitudes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Agregar autenticación
            },
            body: JSON.stringify(datosCliente)
        });
        
        if (!response.ok) {
            throw new Error('Error al crear la solicitud');
        }
        
        return response.json();
    },

    // Obtener estado de una solicitud
    async obtenerEstadoSolicitud(solicitudId) {
        const response = await fetch(`${API_BASE_URL}/api/solicitudes/${solicitudId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el estado de la solicitud');
        }
        
        return response.json();
    },

    // Actualizar estado de una solicitud (usado por director, pedidos y admin)
    async actualizarEstadoSolicitud(solicitudId, datos) {
        const response = await fetch(`${API_BASE_URL}/api/solicitudes/${solicitudId}/aprobar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(datos) // Ejemplo: { aprobar: true, notas: 'Aprobado' }
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar el estado');
        }
        
        return response.json();
    },

    // Obtener solicitudes pendientes según rol
    async obtenerSolicitudesPendientes(rol) {
        const response = await fetch(`${API_BASE_URL}/api/solicitudes/pendientes/${rol}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener solicitudes pendientes');
        }
        
        return response.json();
    },

    // Obtener resumen de solicitudes
    async obtenerResumenSolicitudes() {
        const response = await fetch(`${API_BASE_URL}/api/solicitudes/resumen`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el resumen de solicitudes');
        }
        
        return response.json();
    }
};