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

// Componente interno que usa los hooks correctamente
const AppContent = () => {
    const { user, isLoading, logout } = useAuth();
    
    console.log("AppContent - Usuario actual:", user);
    console.log("¿Tiene propiedad 'rol'?", user ? 'rol' in user : 'No hay usuario');
    console.log("¿Tiene propiedad 'role'?", user ? 'role' in user : 'No hay usuario');
    console.log("Valor del rol:", user?.rol || user?.role || 'No definido');

    // Componente de ruta protegida
    const ProtectedRoute = ({ children, requiredRole }) => {
        console.log("ProtectedRoute - Comprobando acceso:", { 
            userObject: user,
            requiredRole,
            userRol: user?.rol || user?.role,
            isTemporaryPassword: user?.is_temporary_password,
            isLoading
        });
        
        if (isLoading) {
            return <p className="text-gray-600">Cargando...</p>;
        }
        
        if (!user) {
            console.log("ProtectedRoute - No hay usuario, redirigiendo a login");
            return <Navigate to="/login" />;
        }
        
        // Comprueba tanto rol como role
        const userRole = user.rol || user.role;
        
        if (requiredRole && userRole !== requiredRole) {
            console.log(`ProtectedRoute - Usuario no tiene rol requerido (${requiredRole}), redirigiendo a dashboard`);
            return <Navigate to="/dashboard" />;
        }
        
        // Si el usuario tiene una contraseña temporal, redirigir al perfil
        if (user.is_temporary_password && children.type !== PerfilUsuario) {
            console.log("ProtectedRoute - Usuario tiene contraseña temporal, redirigiendo a perfil");
            return <Navigate to="/perfil" />;
        }
        
        console.log("ProtectedRoute - Acceso permitido");
        return children;
    };

    // Barra de navegación
    const NavBarContent = () => {
        const navigate = useNavigate();
        
        // Botón de depuración
        const debugUser = () => {
            console.log("--- DEBUG USER INFO ---");
            console.log("Usuario del contexto:", user);
            console.log("Usuario en localStorage:", JSON.parse(localStorage.getItem('user')));
            console.log("Token en localStorage:", localStorage.getItem('token'));
            
            // Comprobar propiedades críticas
            if (user) {
                console.log("Rol del usuario:", user.rol || user.role || "No tiene rol");
                console.log("Propiedades disponibles:", Object.keys(user));
            }
            
            // Intentar recuperar datos del servidor
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://localhost:8000/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    console.log("Status del perfil:", response.status);
                    if (response.ok) return response.json();
                    throw new Error(`Error ${response.status}`);
                })
                .then(data => console.log("Perfil desde API:", data))
                .catch(err => console.error("Error al obtener perfil:", err));
            }
        };
        
        const handleLogout = () => {
            console.log("Cerrando sesión...");
            logout();
            navigate('/login');
        };

        // Determinar el rol para las condiciones
        const userRole = user?.rol || user?.role;

        // Mostrar menús adaptados al rol
        // El admin ve todo, si eres tú como informático y propietario debes tener acceso a todo
        const isAdminOrOwner = userRole === 'admin' || userRole === 'informatico' || 
                               user?.email === 'fernando.prada@svanelectro.com';

        return (
            <nav className="bg-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/svan-logo.png" alt="SVAN Logo" className="h-8 mr-4" />
                        <Link to="/dashboard" className="text-white hover:text-gray-300 mr-4">Dashboard</Link>
                        <Link to="/mis-solicitudes" className="text-white hover:text-gray-300 mr-4">Mis Solicitudes</Link>
                        
                        {/* Debug de propiedades */}
                        <div className="text-xs text-gray-400 mr-4">
                            {user ? `Email: ${user.email}, Rol: ${userRole || 'sin rol'}` : 'No user'}
                        </div>
                        
                        {/* Siempre muestra estos menús si eres admin o propietario */}
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
                        {/* Botón de depuración */}
                        <button 
                            onClick={debugUser} 
                            className="text-white bg-purple-600 px-2 py-1 rounded mr-2"
                        >
                            Debug User
                        </button>
                        
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

    // Componente para depurar rutas
    const RouteDebugger = () => {
        console.log("Rutas disponibles:");
        console.log("- /dashboard - Dashboard principal");
        console.log("- /mis-solicitudes - Ver mis solicitudes");
        console.log("- /solicitudes-pendientes/:rol - Solicitudes pendientes por rol");
        console.log("- /manage-users - Gestión de usuarios (requiere rol 'admin')");
        console.log("- /perfil - Perfil de usuario");
        console.log("- /nuevo-cliente - Formulario de nuevo cliente (requiere rol 'comercial')");
        
        return null;
    };

    return (
        <Router>
            <RouteDebugger />
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