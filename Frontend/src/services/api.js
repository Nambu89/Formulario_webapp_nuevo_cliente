// src/services/api.js
import axiosInstance from '../utils/axiosConfig';
// Funciñon de login del usuario
const clienteAPI = {
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await axiosInstance.post('/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        return response.data; // Devuelve un .data ya que usamos axios
    },
    
    crearSolicitud: (data) => axiosInstance.post('/api/solicitudes/', data),
    obtenerSolicitudesPendientes: (rol) => axiosInstance.get(`/api/solicitudes/pendientes/${rol}`),
    obtenerResumenSolicitudes: () => axiosInstance.get('/api/solicitudes/resumen'),
    obtenerSolicitudesUsuario: (email) => axiosInstance.get(`/api/solicitudes/usuario/${email}`),
    aprobarRechazarSolicitud: (solicitudId, data) => axiosInstance.put(`/api/solicitudes/${solicitudId}/aprobar`, data),
    uploadDocumento: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosInstance.post('/api/upload/documento', formData);
    },
    // Nuevas solicitudes para gestionar usuarios
    getAllUsers: () => axiosInstance.get('/users'),
    createUser: (data) => axiosInstance.post('/users', data),
    updateUser: (userId, data) => axiosInstance.put(`/users/${userId}`, data),
    deleteUser: (userId) => axiosInstance.delete(`/users/${userId}`),
    // Solicitudes para el perfil del usuario
    getUserProfile: () => axiosInstance.get('/users/me'),
    updateUserProfile: (data) => axiosInstance.put('/users/me', data),
    changePassword: (data) => axiosInstance.post('/users/me/change-password', data),
};

export { clienteAPI };