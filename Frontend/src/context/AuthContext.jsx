import React, { createContext, useContext, useState, useCallback } from 'react';
import { clienteAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Intentando login con:', email);
            
            // Usar fetch directamente para descartar problemas con axiosInstance
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            
            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error al iniciar sesión: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Respuesta del servidor:', data);
    
            // Verificar que tenemos un token válido
            if (!data.access_token) {
                throw new Error('No se recibió un token de acceso válido');
            }
    
            localStorage.setItem('token', data.access_token);
            const userData = {
                email,
                role: data.user_role,
                name: data.user_name
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
    
            return data;
        } catch (err) {
            console.error('Error detallado:', err);
            setError(err.message || 'Error de conexión con el servidor');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const value = {
        user,
        isLoading,
        error,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;