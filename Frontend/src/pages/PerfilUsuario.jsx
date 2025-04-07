// src/pages/PerfilUsuario.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const PerfilUsuario = () => {
    const [user, setUser] = useState(null);
    const [solicitudes, setSolicitudes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileForm, setProfileForm] = useState({
        nombre_completo: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: ''
    });
    const navigate = useNavigate();

    // Obtener el perfil del usuario y sus solicitudes al cargar la página
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Obtener el perfil del usuario
                const userResponse = await clienteAPI.getUserProfile();
                setUser(userResponse.data);
                setProfileForm({
                    nombre_completo: userResponse.data.nombre_completo
                });

                // Si la contraseña es temporal, forzar el cambio
                if (userResponse.data.is_temporary_password) {
                    alert('Debes cambiar tu contraseña temporal antes de continuar.');
                }

                // Obtener las solicitudes del usuario
                const solicitudesResponse = await clienteAPI.obtenerSolicitudesUsuario(userResponse.data.email);
                setSolicitudes(solicitudesResponse.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Error al cargar los datos');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Manejar el cambio en el formulario de perfil
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm({
            ...profileForm,
            [name]: value
        });
    };

    // Manejar el cambio en el formulario de contraseña
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm({
            ...passwordForm,
            [name]: value
        });
    };

    // Actualizar el perfil
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await clienteAPI.updateUserProfile(profileForm);
            setUser(response.data);
            alert('Perfil actualizado con éxito');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    // Cambiar la contraseña
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await clienteAPI.changePassword(passwordForm);
            alert('Contraseña cambiada con éxito');
            setPasswordForm({
                current_password: '',
                new_password: ''
            });
            // Si era una contraseña temporal, redirigir al dashboard
            if (user.is_temporary_password) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al cambiar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <p className="text-gray-600">Cargando...</p>;
    }

    if (!user) {
        return <p className="text-red-600">Error al cargar el perfil</p>;
    }

    return (
        <div className="container mx-auto py-8">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Perfil de Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Información del usuario */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium">Información del Usuario</h3>
                        <p>Email: {user.email}</p>
                        <p>Rol: {user.rol}</p>
                    </div>

                    {/* Formulario para actualizar el perfil */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-4">Actualizar Perfil</h3>
                        {error && (
                            <div className="rounded-md bg-red-50 p-4 mb-4">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        )}
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                                    Nombre Completo
                                </label>
                                <input
                                    id="nombre_completo"
                                    name="nombre_completo"
                                    type="text"
                                    value={profileForm.nombre_completo}
                                    onChange={handleProfileChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Formulario para cambiar la contraseña */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-4">Cambiar Contraseña</h3>
                        {error && (
                            <div className="rounded-md bg-red-50 p-4 mb-4">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        )}
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                                    Contraseña Actual *
                                </label>
                                <input
                                    id="current_password"
                                    name="current_password"
                                    type="password"
                                    required
                                    value={passwordForm.current_password}
                                    onChange={handlePasswordChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                                    Nueva Contraseña *
                                </label>
                                <input
                                    id="new_password"
                                    name="new_password"
                                    type="password"
                                    required
                                    value={passwordForm.new_password}
                                    onChange={handlePasswordChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading || (user.is_temporary_password && !passwordForm.new_password)}
                                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading || (user.is_temporary_password && !passwordForm.new_password) ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sección de solicitudes */}
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
                                                        solicitud.estado === 'COMPLETADO' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : solicitud.estado === 'RECHAZADO'
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