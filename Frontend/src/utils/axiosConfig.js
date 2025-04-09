import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',  
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false // Mantenemos en false para evitar problemas CORS
});

// Añadir interceptor para incluir el token en las peticiones
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        console.error('Error en la configuración de la petición:', error);
        return Promise.reject(error);
    }
);

// Mejorar el interceptor de respuesta para más detalle en los errores
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        // Información detallada del error para depuración
        if (error.response) {
            console.error('Datos del error:', error.response.data);
            console.error('Estado:', error.response.status);
            console.error('Cabeceras:', error.response.headers);
            
            // Sesión expirada o token inválido
            if (error.response.status === 401) {
                console.warn('Sesión expirada o no autorizado');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Solo redirigir si no estamos ya en login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            console.error('No se recibió respuesta del servidor:', error.request);
        } else {
            // Error al configurar la petición
            console.error('Error al configurar la petición:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;