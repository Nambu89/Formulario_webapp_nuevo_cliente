import React from 'react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getEstadoColor = (estado) => {
    switch (estado) {
        case 'pendiente_director':
            return 'bg-yellow-100 text-yellow-800';
        case 'pendiente_pedidos':
            return 'bg-blue-100 text-blue-800';
        case 'pendiente_admin':
            return 'bg-purple-100 text-purple-800';
        case 'completado':
            return 'bg-green-100 text-green-800';
        case 'rechazado':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getEstadoTexto = (estado) => {
    switch (estado) {
        case 'pendiente_director':
            return 'Pendiente Director';
        case 'pendiente_pedidos':
            return 'Pendiente Pedidos';
        case 'pendiente_admin':
            return 'Pendiente Admin';
        case 'completado':
            return 'Completado';
        case 'rechazado':
            return 'Rechazado';
        default:
            return estado;
    }
};

const SolicitudDetalle = ({ solicitud }) => {
    if (!solicitud) return null;

    const datosCliente = solicitud.datos_comercial || {};
    const marcasAprobadas = datosCliente.marcas_aprobadas || [];
    const tarifaAprobada = datosCliente.tarifa_aprobada || '';
    const terminoPago = datosCliente.termino_pago || '';
    const notas = solicitud.notas || {};
    
    return (
        <div className="space-y-6">
            {/* Información básica */}
            <section>
                <h3 className="text-lg font-medium mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="font-medium">{datosCliente.nombre || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">CIF/NIF</p>
                        <p className="font-medium">{datosCliente.cif_nif || 'N/A'}</p>
                    </div>
                </div>
            </section>

            {/* Dirección de Facturación */}
            <section>
                <h3 className="text-lg font-medium mb-3">Dirección de Facturación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium">{datosCliente.direccion || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Población</p>
                        <p className="font-medium">{datosCliente.poblacion || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Código Postal</p>
                        <p className="font-medium">{datosCliente.codigo_postal || 'N/A'}</p>
                    </div>
                </div>
            </section>

            {/* Dirección de Envío - solo se muestra si es diferente */}
            {(datosCliente.direccionEnvio || datosCliente.poblacionEnvio || datosCliente.codigoPostalEnvio) && (
                <section>
                    <h3 className="text-lg font-medium mb-3">Dirección de Envío</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <p className="text-sm text-gray-500">Dirección</p>
                            <p className="font-medium">{datosCliente.direccionEnvio || datosCliente.direccion || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Población</p>
                            <p className="font-medium">{datosCliente.poblacionEnvio || datosCliente.poblacion || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Código Postal</p>
                            <p className="font-medium">{datosCliente.codigoPostalEnvio || datosCliente.codigo_postal || 'N/A'}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Datos de contacto */}
            <section>
                <h3 className="text-lg font-medium mb-3">Datos de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Contacto</p>
                        <p className="font-medium">{datosCliente.nombre_contacto || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{datosCliente.telefono || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Correo</p>
                        <p className="font-medium">{datosCliente.correo || 'N/A'}</p>
                    </div>
                </div>
            </section>

            {/* Información comercial */}
            <section>
                <h3 className="text-lg font-medium mb-3">Información Comercial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Tipo de Carga</p>
                        <p className="font-medium">{datosCliente.tipo_carga || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Método de Pago</p>
                        <p className="font-medium">{datosCliente.metodo_pago || 'N/A'}</p>
                    </div>
                    
                    {/* Mostrar Solicitud de Crédito si existe */}
                    {datosCliente.solicitudCredito > 0 && (
                        <div>
                            <p className="text-sm text-gray-500">Solicitud de Crédito</p>
                            <p className="font-medium">{datosCliente.solicitudCredito.toLocaleString()} €</p>
                        </div>
                    )}
                    
                    {(datosCliente.metodo_pago === 'RECIBO' || datosCliente.metodo_pago === 'RECIBO B2B') && (
                        <div className="col-span-2">
                            <p className="text-sm text-gray-500">Documento SEPA</p>
                            {datosCliente.sepa_documento ? (
                                <a 
                                    href={`http://localhost:8000${datosCliente.sepa_documento}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Ver documento SEPA
                                </a>
                            ) : (
                                <p className="text-yellow-600">No disponible</p>
                            )}
                        </div>
                    )}

                    {terminoPago && (
                        <div>
                            <p className="text-sm text-gray-500">Término de Pago</p>
                            <p className="font-medium">{terminoPago}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Estado de la solicitud */}
            <section>
                <h3 className="text-lg font-medium mb-3">Estado de la Solicitud</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Estado Actual</p>
                        <Badge className={getEstadoColor(solicitud.estado)}>
                            {getEstadoTexto(solicitud.estado)}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Fecha de Creación</p>
                        <p className="font-medium">
                            {solicitud.fecha_creacion ? 
                                format(new Date(solicitud.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                                'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Última Modificación</p>
                        <p className="font-medium">
                            {solicitud.ultima_modificacion ? 
                                format(new Date(solicitud.ultima_modificacion), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                                'N/A'}
                        </p>
                    </div>
                </div>
            </section>
            
            {/* Aprobación del Director - Marcas y Tarifa */}
            {(solicitud.aprobado_director || marcasAprobadas.length > 0 || tarifaAprobada) && (
                <section>
                    <h3 className="text-lg font-medium mb-3">Aprobación del Director</h3>
                    
                    {/* Estado de aprobación */}
                    <div className="mb-3">
                        <Badge className={solicitud.aprobado_director ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {solicitud.aprobado_director ? 'Aprobado' : 'Pendiente'}
                        </Badge>
                    </div>
                    
                    {/* Marcas aprobadas */}
                    {marcasAprobadas.length > 0 && (
                        <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Marcas Aprobadas</p>
                            <div className="flex flex-wrap gap-2">
                                {marcasAprobadas.map(marca => (
                                    <Badge key={marca} className="bg-blue-100 text-blue-800">
                                        {marca}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Tarifa aprobada */}
                    {tarifaAprobada && (
                        <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Tarifa Asignada</p>
                            <Badge className="bg-purple-100 text-purple-800">
                                {tarifaAprobada}
                            </Badge>
                        </div>
                    )}
                    
                    {/* Notas del director */}
                    {notas.director && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Observaciones del Director</p>
                            <p className="p-2 bg-gray-50 rounded">{notas.director}</p>
                        </div>
                    )}
                </section>
            )}
            
            {/* Aprobación de Pedidos */}
            {(solicitud.aprobado_pedidos || notas.pedidos) && (
                <section>
                    <h3 className="text-lg font-medium mb-3">Aprobación de Pedidos</h3>
                    
                    {/* Estado de aprobación */}
                    <div className="mb-3">
                        <Badge className={solicitud.aprobado_pedidos ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {solicitud.aprobado_pedidos ? 'Aprobado' : 'Pendiente'}
                        </Badge>
                    </div>
                    
                    {/* Notas de pedidos */}
                    {notas.pedidos && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Observaciones de Pedidos</p>
                            <p className="p-2 bg-gray-50 rounded">{notas.pedidos}</p>
                        </div>
                    )}
                </section>
            )}
            
            {/* Aprobación de Administración */}
            {(solicitud.aprobado_admin || notas.admin || terminoPago) && (
                <section>
                    <h3 className="text-lg font-medium mb-3">Aprobación de Administración</h3>
                    
                    {/* Estado de aprobación */}
                    <div className="mb-3">
                        <Badge className={solicitud.aprobado_admin ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {solicitud.aprobado_admin ? 'Aprobado' : 'Pendiente'}
                        </Badge>
                    </div>
                    
                    {/* Término de pago */}
                    {terminoPago && (
                        <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Término de Pago Asignado</p>
                            <Badge className="bg-indigo-100 text-indigo-800">
                                {terminoPago}
                            </Badge>
                        </div>
                    )}
                    
                    {/* Notas de admin */}
                    {notas.admin && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Observaciones de Administración</p>
                            <p className="p-2 bg-gray-50 rounded">{notas.admin}</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default SolicitudDetalle;