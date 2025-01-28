import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Plus, ClipboardList, CheckSquare } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [resumen, setResumen] = useState({
        pendientes: 0,
        completadas: 0,
        rechazadas: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResumen = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/solicitudes/resumen', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) throw new Error('Error al cargar resumen');
                const data = await response.json();
                setResumen(data);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResumen();
    }, []);

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
                <h1 className="text-2xl font-bold mb-6">
                    Bienvenido, {user?.name}
                </h1>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-blue-50">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                Solicitudes Pendientes
                            </h3>
                            <p className="text-3xl font-bold text-blue-900">{resumen.pendientes}</p>
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

                    {/* Aprobación de Solicitudes - visible para roles específicos y admin */}
                    {(user?.role === 'director' || user?.role === 'pedidos' || user?.role === 'admin') && (
                        <Button
                            onClick={() => navigate('/aprobacion-solicitudes')}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            {user.role === 'director' ? 'Solicitudes Pendientes de Aprobación' :
                             user.role === 'pedidos' ? 'Solicitudes Pendientes de Pedidos' :
                             'Gestionar Solicitudes'}
                        </Button>
                    )}

                    {/* Panel de Administración - solo visible para admin */}
                    {user?.role === 'admin' && (
                        <>
                            <Button
                                onClick={() => navigate('/admin/usuarios')}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                Gestionar Usuarios
                            </Button>
                            <Button
                                onClick={() => navigate('/admin/solicitudes')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
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