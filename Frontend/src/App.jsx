// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MisSolicitudes from './pages/MisSolicitudes';
import AprobacionSolicitudes from './components/AprobacionSolicitudes';
import ManageUsers from './pages/ManageUsers';
import PerfilUsuario from './pages/PerfilUsuario';
import ClienteForm from './components/ClienteForm';
import { useAuth } from './context/AuthContext';
import { getUserRole } from './utils/auth';

// Componente interno que usa los hooks correctamente
const AppContent = () => {
    const { user, isLoading, logout } = useAuth();

    // Componente de ruta protegida
    const ProtectedRoute = ({ children, requiredRole }) => {
        if (isLoading) {
            return <p className="text-gray-600">Cargando...</p>;
        }
        
        if (!user) {
            return <Navigate to="/login" />;
        }
        
        const userRole = getUserRole(user);
        
        if (requiredRole && userRole !== requiredRole) {
            return <Navigate to="/dashboard" />;
        }
        
        if (user.is_temporary_password && children.type !== PerfilUsuario) {
            return <Navigate to="/perfil" />;
        }
        
        return children;
    };

    // Barra de navegación
    const NavBarContent = () => {
        const navigate = useNavigate();
        
        const handleLogout = () => {
            logout();
            navigate('/login');
        };

        const userRole = getUserRole(user);

        const isAdminOrOwner = userRole === 'admin' || userRole === 'informatico';

        return (
            <nav className="bg-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="Logo" className="h-8 mr-4" />
                        <Link to="/dashboard" className="text-white hover:text-gray-300 mr-4">Dashboard</Link>
                        <Link to="/mis-solicitudes" className="text-white hover:text-gray-300 mr-4">Mis Solicitudes</Link>

                        {isAdminOrOwner && (
                            <>
                                <Link to="/solicitudes-pendientes/admin" className="text-white hover:text-gray-300 mr-4">
                                    Solicitudes Pendientes de Administración
                                </Link>
                                <Link to="/manage-users" className="text-white hover:text-gray-300 mr-4">
                                    Gestionar Usuarios
                                </Link>
                            </>
                        )}
                        
                        {userRole === 'director' && (
                            <Link to="/solicitudes-pendientes/director" className="text-white hover:text-gray-300 mr-4">
                                Solicitudes Pendientes de Dirección
                            </Link>
                        )}
                        
                        {userRole === 'pedidos' && (
                            <Link to="/solicitudes-pendientes/pedidos" className="text-white hover:text-gray-300 mr-4">
                                Solicitudes Pendientes de Pedidos
                            </Link>
                        )}
                        
                        {userRole === 'comercial' && (
                            <Link to="/nuevo-cliente" className="text-white hover:text-gray-300 mr-4">
                                Nueva Solicitud
                            </Link>
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
                <Route path="/login" element={<Login />} />
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
                        <ProtectedRoute>
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
                        <ProtectedRoute>
                            <>
                                <NavBarContent />
                                <ClienteForm />
                            </>
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

// Componente principal que solo renderiza el contenido interno
const App = () => {
    return <AppContent />;
};

export default App;
