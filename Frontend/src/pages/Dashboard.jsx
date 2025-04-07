import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Plus, ClipboardList, CheckSquare, Users, List } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [resumen, setResumen] = useState({
        pendientes: 0,
        completadas: 0,
        rechazadas: 0
    });
    const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResumen = async () => {
            try {
                // Para obtener el resumen general
                const response = await fetch('http://localhost:8000/api/solicitudes/resumen', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) throw new Error('Error al cargar resumen');
                const data = await response.json();
                setResumen(data);
                
                // Para obtener el conteo específico de solicitudes pendientes según el rol
                if (user.role === 'director' || user.role === 'pedidos' || user.role === 'admin') {
                    const pendientesResponse = await fetch(
                        `http://localhost:8000/api/solicitudes/pendientes/${user.role}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );
                    if (pendientesResponse.ok) {
                        const pendientesData = await pendientesResponse.json();
                        setSolicitudesPendientes(pendientesData.length);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResumen();
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

    const getDisplayName = () => {
        if (user?.role === 'admin') return 'Responsable de Administración';
        if (user?.role === 'pedidos') return 'Responsable de Pedidos';
        if (user?.role === 'director') return 'Director Comercial';
        return user?.name || '';
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">
                    Bienvenido, {getDisplayName()}
                </h1>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-blue-50">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                Solicitudes Pendientes
                            </h3>
                            <p className="text-3xl font-bold text-blue-900">
                                {user.role === 'director' || user.role === 'pedidos' || user.role === 'admin' 
                                    ? solicitudesPendientes 
                                    : resumen.pendientes}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-green-700 mb-2">
                                Solicitudes Completadas
                            </h3>
                            <p className="text-3xl font-bold text-green-900">{resumen.completadas}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-red-700 mb-2">
                                Solicitudes Rechazadas
                            </h3>
                            <p className="text-3xl font-bold text-red-900">{resumen.rechazadas}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Acciones Rápidas */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
                    
                    {/* Nueva Solicitud - visible para todos */}
                    <Button
                        onClick={() => navigate('/nuevo-cliente')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Solicitud
                    </Button>

                    {/* Ver Mis Solicitudes - visible para todos */}
                    <Button
                        onClick={() => navigate('/mis-solicitudes')}
                        className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Ver Mis Solicitudes
                    </Button>

                    {/* Aprobación de Solicitudes - visible para roles específicos */}
                    {user?.role === 'director' && (
                        <Button
                            onClick={() => navigate('/aprobacion-solicitudes')}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Solicitudes Pendientes de Aprobación
                        </Button>
                    )}

                    {user?.role === 'pedidos' && (
                        <Button
                            onClick={() => navigate('/aprobacion-solicitudes')}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Solicitudes Pendientes de Pedidos
                        </Button>
                    )}

                    {user?.role === 'admin' && (
                        <>
                            <Button
                                onClick={() => navigate('/aprobacion-solicitudes')}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Solicitudes Pendientes de Administración
                            </Button>
                            
                            <Button
                                onClick={() => navigate('/admin/usuarios')}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Gestionar Usuarios
                            </Button>
                            
                            <Button
                                onClick={() => navigate('/admin/solicitudes')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                <List className="mr-2 h-4 w-4" />
                                Todas las Solicitudes
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;