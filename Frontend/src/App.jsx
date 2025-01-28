import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ClienteForm from './components/ClienteForm';
import MisSolicitudes from './pages/MisSolicitudes';
import AprobacionSolicitudes from './components/AprobacionSolicitudes';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    
    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Rutas protegidas */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/nuevo-cliente" 
                    element={
                        <ProtectedRoute>
                            <ClienteForm />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/mis-solicitudes" 
                    element={
                        <ProtectedRoute>
                            <MisSolicitudes />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/aprobacion-solicitudes" 
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={['director', 'pedidos', 'admin']}>
                                <AprobacionSolicitudes />
                            </RoleRoute>
                        </ProtectedRoute>
                    } 
                />
                
                {/* Ruta por defecto */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;