import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
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

const SolicitudesTable = ({ solicitudes, onAprobar, onRechazar, showActions = false }) => {
    console.log('Solicitudes recibidas en la tabla:', solicitudes); // Depuración
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Cliente</th>
                        <th className="px-6 py-3">CIF/NIF</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Tipo Carga</th>
                        {showActions && <th className="px-6 py-3">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {solicitudes.map((solicitud) => (
                        <tr key={solicitud.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {solicitud.datos_comercial?.nombre || 'Sin nombre'}
                            </td>
                            <td className="px-6 py-4">
                                {solicitud.datos_comercial?.cif_nif || 'Sin CIF/NIF'}
                            </td>
                            <td className="px-6 py-4">
                                <Badge className={getEstadoColor(solicitud.estado)}>
                                    {getEstadoTexto(solicitud.estado)}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                {solicitud.fecha_creacion ? format(new Date(solicitud.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Sin fecha'}
                            </td>
                            <td className="px-6 py-4">
                                {solicitud.datos_comercial?.tipo_carga || 'Sin tipo'}
                            </td>
                            {showActions && (
                                <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => onAprobar(solicitud.id)}
                                            className="bg-green-600 hover:bg-green-700"
                                            size="sm"
                                        >
                                            Aprobar
                                        </Button>
                                        <Button
                                            onClick={() => onRechazar(solicitud.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                            size="sm"
                                        >
                                            Rechazar
                                        </Button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SolicitudesTable;