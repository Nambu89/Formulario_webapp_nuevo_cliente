import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',  // Asegúrate de que sea 8000
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false
});

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        console.error('Error en la petición:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;