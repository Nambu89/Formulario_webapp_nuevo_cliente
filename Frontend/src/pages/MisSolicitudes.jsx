import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import SolicitudesTable from '../components/SolicitudesTable';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const MisSolicitudes = () => {
    const { user } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                if (user.role === 'director') {
                    const pendientesData = await fetch(`http://localhost:8000/api/solicitudes/pendientes/director`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (!pendientesData.ok) throw new Error('Error al cargar solicitudes pendientes');
                    const data = await pendientesData.json();
                    setSolicitudes(data);
                } else {
                    const response = await fetch(`http://localhost:8000/api/solicitudes/usuario/${encodeURIComponent(user.email)}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (!response.ok) throw new Error('Error al cargar las solicitudes del usuario');
                    const data = await response.json();
                    setSolicitudes(data);
                }
            } catch (error) {
                console.error('Error:', error);
                setError('Error al cargar las solicitudes. Verifica tu conexión o contacta al administrador.');
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitudes();
    }, [user]);

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Mis solicitudes</h1>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : solicitudes.length > 0 ? (
                    <SolicitudesTable 
                        solicitudes={solicitudes}
                        showActions={false} // O ajusta según si necesitas acciones
                    />
                ) : (
                    <p className="text-center text-gray-500">
                        No hay solicitudes disponibles.
                    </p>
                )}
            </div>
        </Layout>
    );
};

export default MisSolicitudes;