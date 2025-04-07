// src/pages/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { clienteAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        nombre_completo: '',
        rol: 'comercial',
        activo: true
    });
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre_completo: '',
        rol: '',
        activo: true,
        password: ''
    });
    const navigate = useNavigate();

    // Obtener todos los usuarios al cargar la página
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const response = await clienteAPI.getAllUsers();
                setUsers(response.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Error al cargar los usuarios');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Manejar el cambio en el formulario de nuevo usuario
    const handleNewUserChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewUser({
            ...newUser,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Crear un nuevo usuario
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await clienteAPI.createUser(newUser);
            alert(`Usuario creado con éxito. Contraseña temporal: ${response.data.temporary_password}`);
            setUsers([...users, response.data.user]);
            setNewUser({
                email: '',
                nombre_completo: '',
                rol: 'comercial',
                activo: true
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al crear el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    // Iniciar la edición de un usuario
    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditForm({
            nombre_completo: user.nombre_completo,
            rol: user.rol,
            activo: user.activo,
            password: ''
        });
    };

    // Manejar el cambio en el formulario de edición
    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm({
            ...editForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Actualizar un usuario
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await clienteAPI.updateUser(editingUser.id, editForm);
            setUsers(users.map(user => user.id === editingUser.id ? response.data : user));
            setEditingUser(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al actualizar el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    // Eliminar un usuario
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
        setIsLoading(true);
        setError(null);
        try {
            await clienteAPI.deleteUser(userId);
            setUsers(users.filter(user => user.id !== userId));
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al eliminar el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestionar Usuarios</h2>

            {/* Formulario para crear un nuevo usuario */}
            <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={newUser.email}
                                onChange={handleNewUserChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                                Nombre Completo *
                            </label>
                            <input
                                id="nombre_completo"
                                name="nombre_completo"
                                type="text"
                                required
                                value={newUser.nombre_completo}
                                onChange={handleNewUserChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                                Rol *
                            </label>
                            <select
                                id="rol"
                                name="rol"
                                value={newUser.rol}
                                onChange={handleNewUserChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="comercial">Comercial</option>
                                <option value="director">Director</option>
                                <option value="pedidos">Pedidos</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="activo" className="block text-sm font-medium text-gray-700">
                                Activo *
                            </label>
                            <input
                                id="activo"
                                name="activo"
                                type="checkbox"
                                checked={newUser.activo}
                                onChange={handleNewUserChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {isLoading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tabla de usuarios */}
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Lista de Usuarios</h3>
                {isLoading && <p className="text-gray-600">Cargando...</p>}
                {error && (
                    <div className="rounded-md bg-red-50 p-4 mb-4">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nombre_completo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.rol}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.activo ? 'Sí' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para editar usuario */}
            {editingUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Editar Usuario</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label htmlFor="edit_nombre_completo" className="block text-sm font-medium text-gray-700">
                                    Nombre Completo
                                </label>
                                <input
                                    id="edit_nombre_completo"
                                    name="nombre_completo"
                                    type="text"
                                    value={editForm.nombre_completo}
                                    onChange={handleEditFormChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit_rol" className="block text-sm font-medium text-gray-700">
                                    Rol
                                </label>
                                <select
                                    id="edit_rol"
                                    name="rol"
                                    value={editForm.rol}
                                    onChange={handleEditFormChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="comercial">Comercial</option>
                                    <option value="director">Director</option>
                                    <option value="pedidos">Pedidos</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="edit_activo" className="block text-sm font-medium text-gray-700">
                                    Activo
                                </label>
                                <input
                                    id="edit_activo"
                                    name="activo"
                                    type="checkbox"
                                    checked={editForm.activo}
                                    onChange={handleEditFormChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit_password" className="block text-sm font-medium text-gray-700">
                                    Nueva Contraseña (Opcional)
                                </label>
                                <input
                                    id="edit_password"
                                    name="password"
                                    type="password"
                                    value={editForm.password}
                                    onChange={handleEditFormChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancelar
                                </button>
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
                </div>
            )}
        </div>
    );
};

export default ManageUsers;