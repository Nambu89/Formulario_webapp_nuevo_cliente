import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="bg-white shadow-sm rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">
                    Bienvenido, {user?.name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tarjeta de Solicitudes Pendientes */}
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-700 mb-2">
                            Solicitudes Pendientes
                        </h3>
                        <p className="text-3xl font-bold text-blue-900">0</p>
                    </div>

                    {/* Tarjeta de Solicitudes Completadas */}
                    <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-700 mb-2">
                            Solicitudes Completadas
                        </h3>
                        <p className="text-3xl font-bold text-green-900">0</p>
                    </div>

                    {/* Tarjeta de Solicitudes Rechazadas */}
                    <div className="bg-red-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-red-700 mb-2">
                            Solicitudes Rechazadas
                        </h3>
                        <p className="text-3xl font-bold text-red-900">0</p>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
                    <div className="space-y-4">
                        {user?.role === 'comercial' && (
                            <button 
                                onClick={() => navigate('/nuevo-cliente')}
                                className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                <span>Nuevo Cliente</span>
                            </button>
                        )}
                        
                        <button 
                            onClick={() => navigate('/mis-solicitudes')}
                            className="w-full p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
                            </svg>
                            <span>Ver Mis Solicitudes</span>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;