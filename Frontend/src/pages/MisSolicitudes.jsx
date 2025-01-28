import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import SolicitudesTable from '../components/SolicitudesTable';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const MisSolicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8000/api/solicitudes/usuario/${encodeURIComponent(user.email)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                if (!response.ok) {
                    throw new Error('Error al cargar las solicitudes');
                }
                const data = await response.json();
                setSolicitudes(data);
            } catch (error) {
                console.error('Error:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitudes();
    }, [user.email]);

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
                <Card>
                    <CardHeader>
                        <CardTitle>Mis Solicitudes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : solicitudes.length > 0 ? (
                            <SolicitudesTable solicitudes={solicitudes} />
                        ) : (
                            <p className="text-center text-gray-500">No hay solicitudes para mostrar</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default MisSolicitudes;