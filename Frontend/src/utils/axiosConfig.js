import axios from 'axios';
import { API_BASE_URL } from '../config';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    // No establecer el Content-Type por defecto, dejarlo a Axios
    withCredentials: false // Mantenemos en false para evitar problemas CORS
});

// Añadir interceptor para incluir el token en las peticiones
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Importante: No sobreescribir el Content-Type si es FormData
        if (config.data instanceof FormData) {
            // Eliminar el Content-Type para que Axios lo establezca con el boundary correcto
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Mejorar el interceptor de respuesta para más detalle en los errores
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
