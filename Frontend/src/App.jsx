import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import NuevoCliente from './pages/NuevoCliente';
import ProtectedRoute from './components/auth/ProtectedRoute';

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