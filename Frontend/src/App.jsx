import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import NuevoCliente from './pages/NuevoCliente';

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
    // Verificamos si hay un token de autenticación
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Si no hay token, redirigimos al login
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    {/* Ruta pública para el login */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Ruta protegida para el formulario de nuevo cliente */}
                    <Route 
                        path="/nuevo-cliente" 
                        element={
                            <ProtectedRoute>
                                <NuevoCliente />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Redirigir la ruta raíz al login */}
                    <Route 
                        path="/" 
                        element={<Navigate to="/login" replace />} 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;