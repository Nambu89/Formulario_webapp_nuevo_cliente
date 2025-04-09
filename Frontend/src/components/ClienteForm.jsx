import React, { useState } from 'react';
import { clienteAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ClienteForm = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        poblacion: '',
        codigoPostal: '',
        direccionEnvio: '',
        poblacionEnvio: '',
        codigoPostalEnvio: '',
        nombreContacto: '',
        telefono: '',
        correo: '',
        cif_nif: '',
        tipoCarga: 'COMP',
        metodoPago: 'TRANSFERENCIA',
        solicitudCredito: 0,
        esAutonomo: false,
        documentos: {
            sepa: null // Cambiamos a null para manejar el archivo
        }
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sameAddress, setSameAddress] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name in formData.documentos) {
            setFormData({
                ...formData,
                documentos: {
                    ...formData.documentos,
                    [name]: type === 'file' ? files[0] : value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value
            });
        }
    };

    const handleSameAddressChange = (e) => {
        const checked = e.target.checked;
        setSameAddress(checked);
        if (checked) {
            setFormData({
                ...formData,
                direccionEnvio: formData.direccion,
                poblacionEnvio: formData.poblacion,
                codigoPostalEnvio: formData.codigoPostal
            });
        } else {
            setFormData({
                ...formData,
                direccionEnvio: '',
                poblacionEnvio: '',
                codigoPostalEnvio: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
    
        // Log para depuración
        console.log("Datos del formulario a enviar:", formData);
    
        // Crear un FormData para enviar los datos y el archivo
        const formDataToSend = new FormData();
        formDataToSend.append('nombre', formData.nombre);
        formDataToSend.append('direccion', formData.direccion);
        formDataToSend.append('poblacion', formData.poblacion);
        formDataToSend.append('codigoPostal', formData.codigoPostal);
        
        // Campos opcionales de dirección de envío - usar string vacía si es null/undefined
        formDataToSend.append('direccionEnvio', formData.direccionEnvio || '');
        formDataToSend.append('poblacionEnvio', formData.poblacionEnvio || '');
        formDataToSend.append('codigoPostalEnvio', formData.codigoPostalEnvio || '');
        
        formDataToSend.append('nombreContacto', formData.nombreContacto);
        formDataToSend.append('telefono', formData.telefono);
        formDataToSend.append('correo', formData.correo);
        formDataToSend.append('cif_nif', formData.cif_nif);
        formDataToSend.append('tipoCarga', formData.tipoCarga);
        formDataToSend.append('metodoPago', formData.metodoPago);
        
        // Convertir el valor numérico a string
        formDataToSend.append('solicitudCredito', formData.solicitudCredito.toString());
        
        // Convertir booleano a string ('true' o 'false')
        formDataToSend.append('esAutonomo', formData.esAutonomo.toString());
        
        // Añadir el archivo SEPA si existe
        if (formData.documentos.sepa) {
            formDataToSend.append('sepa', formData.documentos.sepa);
        }
    
        try {
            // Usamos fetch directamente para tener más control
            const response = await fetch('http://localhost:8000/api/solicitudes/', {
                method: 'POST',
                headers: {
                    // No añadir 'Content-Type' - el navegador lo hará automáticamente con el límite correcto
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataToSend
            });
    
            // Para depuración: Ver qué recibimos como respuesta
            console.log("Status de respuesta:", response.status);
            
            // Si hay error, intentamos obtener el mensaje
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Datos de error:", errorData);
                throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log("Respuesta exitosa:", data);
            
            alert('Solicitud creada con éxito');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error completo:', err);
            setError(err.message || 'Error al crear la solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/dashboard');
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Alta de Cliente</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error al crear la solicitud: {JSON.stringify(error)}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                            Nombre del Cliente *
                        </label>
                        <div className="mt-1">
                            <input
                                id="nombre"
                                name="nombre"
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cif_nif" className="block text-sm font-medium text-gray-700">
                            CIF/NIF *
                        </label>
                        <div className="mt-1">
                            <input
                                id="cif_nif"
                                name="cif_nif"
                                type="text"
                                required
                                value={formData.cif_nif}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                            Dirección de Facturación *
                        </label>
                        <div className="mt-1">
                            <input
                                id="direccion"
                                name="direccion"
                                type="text"
                                required
                                value={formData.direccion}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="poblacion" className="block text-sm font-medium text-gray-700">
                            Población *
                        </label>
                        <div className="mt-1">
                            <input
                                id="poblacion"
                                name="poblacion"
                                type="text"
                                required
                                value={formData.poblacion}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700">
                            Código Postal *
                        </label>
                        <div className="mt-1">
                            <input
                                id="codigoPostal"
                                name="codigoPostal"
                                type="text"
                                required
                                value={formData.codigoPostal}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-800 mt-6">Dirección de Envío</h3>
                    <div className="mt-2 flex items-center">
                        <input
                            id="sameAddress"
                            name="sameAddress"
                            type="checkbox"
                            checked={sameAddress}
                            onChange={handleSameAddressChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="sameAddress" className="ml-2 text-sm text-gray-700">
                            Misma que facturación
                        </label>
                    </div>
                </div>

                {!sameAddress && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="direccionEnvio" className="block text-sm font-medium text-gray-700">
                                Dirección de Envío
                            </label>
                            <div className="mt-1">
                                <input
                                    id="direccionEnvio"
                                    name="direccionEnvio"
                                    type="text"
                                    value={formData.direccionEnvio}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="poblacionEnvio" className="block text-sm font-medium text-gray-700">
                                Población de Envío
                            </label>
                            <div className="mt-1">
                                <input
                                    id="poblacionEnvio"
                                    name="poblacionEnvio"
                                    type="text"
                                    value={formData.poblacionEnvio}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="codigoPostalEnvio" className="block text-sm font-medium text-gray-700">
                                Código Postal de Envío
                            </label>
                            <div className="mt-1">
                                <input
                                    id="codigoPostalEnvio"
                                    name="codigoPostalEnvio"
                                    type="text"
                                    value={formData.codigoPostalEnvio}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <h3 className="text-lg font-medium text-gray-800 mt-6">Datos de Contacto y Comerciales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombreContacto" className="block text-sm font-medium text-gray-700">
                            Nombre de Contacto *
                        </label>
                        <div className="mt-1">
                            <input
                                id="nombreContacto"
                                name="nombreContacto"
                                type="text"
                                required
                                value={formData.nombreContacto}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                            Teléfono *
                        </label>
                        <div className="mt-1">
                            <input
                                id="telefono"
                                name="telefono"
                                type="text"
                                required
                                value={formData.telefono}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                            Correo Electrónico *
                        </label>
                        <div className="mt-1">
                            <input
                                id="correo"
                                name="correo"
                                type="email"
                                required
                                value={formData.correo}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="tipoCarga" className="block text-sm font-medium text-gray-700">
                            Tipo de Carga *
                        </label>
                        <div className="mt-1">
                            <select
                                id="tipoCarga"
                                name="tipoCarga"
                                value={formData.tipoCarga}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="COMP">COMP</option>
                                <option value="CROSS">CROSS</option>
                                <option value="GRUP">GRUP</option>
                                <option value="TTPRO">TTPRO</option>
                            </select>
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-medium text-gray-800 mt-6">Información de Pago</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700">
                            Método de Pago *
                        </label>
                        <div className="mt-1">
                            <select
                                id="metodoPago"
                                name="metodoPago"
                                value={formData.metodoPago}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                <option value="RECIBO">RECIBO</option>
                                <option value="RECIBO B2B">RECIBO B2B</option>
                                <option value="CONF. CLIENTE">CONF. CLIENTE</option>
                                <option value="CRÉDITO">CRÉDITO</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="solicitudCredito" className="block text-sm font-medium text-gray-700">
                            Solicitud de Crédito
                        </label>
                        <div className="mt-1">
                            <input
                                id="solicitudCredito"
                                name="solicitudCredito"
                                type="number"
                                value={formData.solicitudCredito}
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                {(formData.metodoPago === 'RECIBO' || formData.metodoPago === 'RECIBO B2B') && (
                    <div>
                        <label htmlFor="sepa" className="block text-sm font-medium text-gray-700">
                            Documento SEPA (Obligatorio)
                        </label>
                        <div className="mt-1">
                            <input
                                id="sepa"
                                name="sepa"
                                type="file"
                                onChange={handleChange}
                                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="esAutonomo" className="block text-sm font-medium text-gray-700">
                        ¿Es Autónomo? *
                    </label>
                    <div className="mt-1">
                        <input
                            id="esAutonomo"
                            name="esAutonomo"
                            type="checkbox"
                            checked={formData.esAutonomo}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Enviando...
                            </span>
                        ) : (
                            'Enviar Solicitud'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClienteForm;