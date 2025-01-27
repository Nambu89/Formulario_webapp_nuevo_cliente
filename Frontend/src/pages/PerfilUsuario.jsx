import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const PerfilUsuario = () => {
    const { user } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/solicitudes/usuario/${user.email}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                setSolicitudes(data);
            } catch (error) {
                console.error('Error al cargar solicitudes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSolicitudes();
    }, [user.email]);

    return (
        <div className="container mx-auto py-8">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Perfil de Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <h3 className="text-lg font-medium">Información del Usuario</h3>
                        <p>Nombre: {user.name}</p>
                        <p>Email: {user.email}</p>
                        <p>Rol: {user.role}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-4">Mis Solicitudes</h3>
                        {isLoading ? (
                            <p>Cargando solicitudes...</p>
                        ) : solicitudes.length > 0 ? (
                            <div className="space-y-4">
                                {solicitudes.map((solicitud) => (
                                    <Card key={solicitud.id}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Cliente: {solicitud.datos_comercial.nombre}</p>
                                                    <p className="text-sm text-gray-600">Estado: {solicitud.estado}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Fecha: {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                                        solicitud.estado === 'completado' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : solicitud.estado === 'rechazado'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {solicitud.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p>No hay solicitudes para mostrar</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PerfilUsuario;