import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const MisSolicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8000/api/solicitudes/usuario/${user.email}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
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
        <Layout>
            <div className="bg-white shadow-sm rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Mis Solicitudes</h1>

                {isLoading ? (
                    <p>Cargando solicitudes...</p>
                ) : solicitudes.length > 0 ? (
                    <div className="space-y-4">
                        {solicitudes.map((solicitud) => (
                            <div 
                                key={solicitud.id} 
                                className="border rounded-lg p-4 hover:bg-gray-50"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">
                                            Cliente: {solicitud.datos_comercial?.nombre || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Estado: {solicitud.estado}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Fecha: {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                                        </p>
                                    </div>
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
                        ))}
                    </div>
                ) : (
                    <p>No hay solicitudes para mostrar</p>
                )}
            </div>
        </Layout>
    );
};

export default MisSolicitudes;