// src/components/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    
    // Si no hay usuario autenticado, redirige al login
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

export default ProtectedRoute;