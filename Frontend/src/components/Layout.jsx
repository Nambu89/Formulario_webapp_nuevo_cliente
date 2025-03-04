import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Función para obtener el nombre a mostrar según el rol
    const getDisplayName = () => {
        if (user?.role === 'admin') return 'Responsable de Administración';
        if (user?.role === 'pedidos') return 'Responsable de Pedidos';
        if (user?.role === 'director') return 'Director Comercial';
        return user?.name || '';
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Barra de navegación superior */}
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <img
                                    className="h-8 w-auto"
                                    src="/logo.png"
                                    alt="SVAN Logo"
                                />
                            </div>
                            
                            {/* Enlaces de navegación */}
                            <div className="hidden md:flex space-x-8 ml-10">
                                <Link 
                                    to="/dashboard" 
                                    className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                                >
                                    Dashboard
                                </Link>
                                {user?.role === 'comercial' && (
                                    <Link 
                                        to="/nuevo-cliente" 
                                        className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                                    >
                                        Nuevo Cliente
                                    </Link>
                                )}
                                <Link 
                                    to="/mis-solicitudes" 
                                    className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                                >
                                    Mis Solicitudes
                                </Link>
                            </div>
                        </div>

                        {/* Menú de usuario */}
                        <div className="flex items-center">
                            <div className="ml-3 relative">
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-700">{getDisplayName()}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;