// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const clienteAPI = {
    // Crear nuevo cliente (usado por el comercial)
    async crearCliente(datosCliente) {
        const response = await fetch(`${API_BASE_URL}/clientes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosCliente)
        });
        
        if (!response.ok) {
            throw new Error('Error al crear el cliente');
        }
        
        return response.json();
    },

    // Obtener estado de una solicitud
    async obtenerEstadoSolicitud(solicitudId) {
        const response = await fetch(`${API_BASE_URL}/clientes/${solicitudId}`);
        
        if (!response.ok) {
            throw new Error('Error al obtener el estado de la solicitud');
        }
        
        return response.json();
    },

    // Actualizar estado de una solicitud (usado por director comercial, pedidos y administración)
    async actualizarEstadoSolicitud(solicitudId, nuevoEstado, comentarios = '') {
        const response = await fetch(`${API_BASE_URL}/clientes/${solicitudId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                estado: nuevoEstado,
                comentarios
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar el estado');
        }
        
        return response.json();
    }
};