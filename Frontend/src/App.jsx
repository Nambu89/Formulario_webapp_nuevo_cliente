import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NuevoCliente from './pages/NuevoCliente';
import MisSolicitudes from './pages/MisSolicitudes';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                
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
                            <NuevoCliente />
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
                
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;