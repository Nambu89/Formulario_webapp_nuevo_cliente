// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MisSolicitudes from './pages/MisSolicitudes';
import AprobacionSolicitudes from './components/AprobacionSolicitudes';
import ManageUsers from './pages/ManageUsers';
import PerfilUsuario from './pages/PerfilUsuario';
import ClienteForm from './components/ClienteForm';
import { clienteAPI } from './services/api';

const App = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Obtener el perfil del usuario al cargar la aplicación
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Verificar si hay un usuario en localStorage
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                } else {
                    // Si no hay método getUserProfile, podemos usar el token para obtener datos del usuario
                    const token = localStorage.getItem('token');
                    if (token) {
                        // Implementar la lógica para obtener los datos del usuario
                    }
                }
            } catch (err) {
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Componente de ruta protegida
    const ProtectedRoute = ({ children, requiredRole }) => {
        if (isLoading) {
            return <p className="text-gray-600">Cargando...</p>;
        }
        if (!user) {
            return <Navigate to="/login" />;
        }
        if (requiredRole && user.rol !== requiredRole) {
            return <Navigate to="/dashboard" />;
        }
        // Si el usuario tiene una contraseña temporal, redirigir al perfil
        if (user.is_temporary_password && children.type !== PerfilUsuario) {
            return <Navigate to="/perfil" />;
        }
        return children;
    };

    // Componente de navegación - Movido fuera del componente principal
    const NavBarContent = () => {
        const navigate = useNavigate(); // Usar useNavigate como un hook dentro del componente funcional
        
        const handleLogout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/login');
        };

        return (
            <nav className="bg-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/svan-logo.png" alt="SVAN Logo" className="h-8 mr-4" />
                        <Link to="/dashboard" className="text-white hover:text-gray-300 mr-4">Dashboard</Link>
                        <Link to="/mis-solicitudes" className="text-white hover:text-gray-300 mr-4">Mis Solicitudes</Link>
                        {user && user.rol === 'admin' && (
                            <>
                                <Link to="/solicitudes-pendientes/admin" className="text-white hover:text-gray-300 mr-4">Solicitudes Pendientes de Administración</Link>
                                <Link to="/manage-users" className="text-white hover:text-gray-300 mr-4">Gestionar Usuarios</Link>
                            </>
                        )}
                        {user && user.rol === 'director' && (
                            <Link to="/solicitudes-pendientes/director" className="text-white hover:text-gray-300 mr-4">Solicitudes Pendientes de Dirección</Link>
                        )}
                        {user && user.rol === 'pedidos' && (
                            <Link to="/solicitudes-pendientes/pedidos" className="text-white hover:text-gray-300 mr-4">Solicitudes Pendientes de Pedidos</Link>
                        )}
                        {user && user.rol === 'comercial' && (
                            <Link to="/nuevo-cliente" className="text-white hover:text-gray-300 mr-4">Nueva Solicitud</Link>
                        )}
                    </div>
                    <div className="flex items-center">
                        <Link to="/perfil" className="text-white hover:text-gray-300 mr-4">Perfil</Link>
                        <button
                            onClick={handleLogout}
                            className="text-white hover:text-gray-300"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </nav>
        );
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <>
                                <NavBarContent />
                                <Dashboard />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mis-solicitudes"
                    element={
                        <ProtectedRoute>
                            <>
                                <NavBarContent />
                                <MisSolicitudes />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/solicitudes-pendientes/:rol"
                    element={
                        <ProtectedRoute>
                            <>
                                <NavBarContent />
                                <AprobacionSolicitudes />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manage-users"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <>
                                <NavBarContent />
                                <ManageUsers />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/perfil"
                    element={
                        <ProtectedRoute>
                            <>
                                <NavBarContent />
                                <PerfilUsuario />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/nuevo-cliente"
                    element={
                        <ProtectedRoute requiredRole="comercial">
                            <>
                                <NavBarContent />
                                <ClienteForm />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

export default App;