import React, { useState, useEffect, useCallback } from 'react';
import Layout from './Layout';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useAuth } from '../context/AuthContext';
import SolicitudesTable from './SolicitudesTable';
import SolicitudDetalle from './SolicitudDetalle';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

// Selector de marcas
const MarcasSelector = ({ selectedMarcas, onChange }) => {
    const marcas = [
        { id: 'SV', label: 'SVAN (SV)' },
        { id: 'WD', label: 'Wonder (WD)' },
        { id: 'AS', label: 'Aspes (AS)' },
        { id: 'HY', label: 'Hyundai (HY)' }
    ];

    const handleMarcaChange = (marcaId) => {
        if (selectedMarcas.includes(marcaId)) {
            onChange(selectedMarcas.filter(id => id !== marcaId));
        } else {
            onChange([...selectedMarcas, marcaId]);
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-base font-medium">Marcas</Label>
            <div className="grid grid-cols-2 gap-4">
                {marcas.map(marca => (
                    <div key={marca.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`marca-${marca.id}`}
                            checked={selectedMarcas.includes(marca.id)} 
                            onCheckedChange={() => handleMarcaChange(marca.id)}
                        />
                        <Label 
                            htmlFor={`marca-${marca.id}`}
                            className="text-sm font-normal cursor-pointer"
                        >
                            {marca.label}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Selector de tarifas
const TarifaSelector = ({ selectedTarifa, onChange }) => {
    const tarifas = [
        { id: 'XEGC', label: 'XEGC' },
        { id: 'DZLM', label: 'DZLM' },
        { id: 'AFDZLM', label: 'AFDZLM' },
        { id: 'WJPI', label: 'WJPI' }
    ];

    return (
        <div className="space-y-2">
            <Label className="text-base font-medium">Tarifa</Label>
            <div className="grid grid-cols-2 gap-4">
                {tarifas.map(tarifa => (
                    <div key={tarifa.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`tarifa-${tarifa.id}`}
                            checked={selectedTarifa === tarifa.id}
                            onCheckedChange={() => onChange(tarifa.id)}
                        />
                        <Label 
                            htmlFor={`tarifa-${tarifa.id}`}
                            className="text-sm font-normal cursor-pointer"
                        >
                            {tarifa.label}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Selector de términos de pago
const TerminosPagoSelector = ({ selectedTermino, onChange }) => {
    const terminosPago = [
        { id: 'PREPAGO', label: 'PREPAGO' },
        { id: '30D', label: '30 DÍAS' },
        { id: '60D', label: '60 DÍAS' }
    ];

    return (
        <div className="space-y-2">
            <Label className="text-base font-medium">Términos de Pago</Label>
            <div className="grid grid-cols-2 gap-4">
                {terminosPago.map(termino => (
                    <div key={termino.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`termino-${termino.id}`}
                            checked={selectedTermino === termino.id}
                            onCheckedChange={() => onChange(termino.id)}
                        />
                        <Label 
                            htmlFor={`termino-${termino.id}`}
                            className="text-sm font-normal cursor-pointer"
                        >
                            {termino.label}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AprobacionSolicitudes = () => {
    const { user } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [selectedSolicitudData, setSelectedSolicitudData] = useState(null);
    const [notas, setNotas] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [accion, setAccion] = useState(null);
    
    const [selectedMarcas, setSelectedMarcas] = useState([]);
    const [selectedTarifa, setSelectedTarifa] = useState('');
    const [selectedTerminoPago, setSelectedTerminoPago] = useState('');

    const fetchSolicitudes = useCallback(async () => {
        if (!user || !user.role) {
            setError('Usuario no autenticado o rol no definido. Por favor, inicia sesión nuevamente.');
            setLoading(false);
            return;
        }

        try {
            console.log(`Obteniendo solicitudes para rol: ${user.role}`);
            const response = await fetch(
                `http://localhost:8000/api/solicitudes/pendientes/${user.role}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al cargar solicitudes pendientes: ${errorText}`);
            }
            const data = await response.json();
            console.log('Datos recibidos:', data);
            setSolicitudes(data || []);
        } catch (error) {
            console.error('Error detallado:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSolicitudes();
    }, [fetchSolicitudes]);

    const handleAprobarRechazar = async (solicitudId, esAprobacion) => {
        // Buscar la solicitud seleccionada en el array de solicitudes
        const solicitud = solicitudes.find(s => s.id === solicitudId);
        if (!solicitud) {
            setError('No se pudo encontrar la solicitud seleccionada');
            return;
        }
        
        setSelectedSolicitud(solicitudId);
        setSelectedSolicitudData(solicitud);
        setAccion(esAprobacion ? 'aprobar' : 'rechazar');
        setNotas('');
        
        // Inicializar los campos con valores existentes si hay
        if (solicitud.datos_comercial) {
            setSelectedMarcas(solicitud.datos_comercial.marcas_aprobadas || []);
            setSelectedTarifa(solicitud.datos_comercial.tarifa_aprobada || '');
            setSelectedTerminoPago(solicitud.datos_comercial.termino_pago || '');
        }
        
        setDialogOpen(true);
        console.log('Solicitud seleccionada:', solicitud);
        console.log('Usuario actual rol:', user.role);
    };

    const handleConfirmar = async () => {
        setIsApproving(true);
        try {
            const datosAprobacion = {
                aprobar: accion === 'aprobar',
                notas: notas
            };

            // Validaciones y datos adicionales según el rol
            if (user.role === 'director' && accion === 'aprobar') {
                if (selectedMarcas.length === 0) {
                    throw new Error('Debe seleccionar al menos una marca');
                }
                if (!selectedTarifa) {
                    throw new Error('Debe seleccionar una tarifa');
                }
                
                datosAprobacion.marcas = selectedMarcas;
                datosAprobacion.tarifa = selectedTarifa;
            }
            
            // Añadir términos de pago para admin
            if (user.role === 'admin' && accion === 'aprobar') {
                if (!selectedTerminoPago) {
                    throw new Error('Debe seleccionar un término de pago');
                }
                datosAprobacion.termino_pago = selectedTerminoPago;
            }

            console.log('Enviando datos:', datosAprobacion);
            const response = await fetch(`http://localhost:8000/api/solicitudes/${selectedSolicitud}/aprobar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(datosAprobacion)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al procesar la solicitud');
            }

            await fetchSolicitudes();
            setDialogOpen(false);
            
            // Mostrar mensaje de éxito
            setSuccessMessage(`Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
            setTimeout(() => setSuccessMessage(''), 3000); // Ocultar después de 3 segundos
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setIsApproving(false);
        }
    };

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
                {successMessage && (
                    <Alert className="mb-4 bg-green-50 border-green-400 text-green-800">
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}
                
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Solicitudes Pendientes de {user.role === 'director' ? 'Director' : 
                                                     user.role === 'pedidos' ? 'Pedidos' : 
                                                     'Administración'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : solicitudes.length > 0 ? (
                            <SolicitudesTable 
                                solicitudes={solicitudes}
                                showActions={true}
                                onAprobar={(id) => handleAprobarRechazar(id, true)}
                                onRechazar={(id) => handleAprobarRechazar(id, false)}
                            />
                        ) : (
                            <p className="text-center text-gray-500">
                                No hay solicitudes pendientes de aprobación
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            {accion === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* Sección de información del cliente */}
                        <div className="border p-4 rounded-md bg-gray-50">
                            {selectedSolicitudData && <SolicitudDetalle solicitud={selectedSolicitudData} />}
                        </div>
                        
                        {/* Sección de aprobación según rol */}
                        <div className="border p-4 rounded-md">
                            <h3 className="text-lg font-medium mb-4">
                                {accion === 'aprobar' ? 'Formulario de Aprobación' : 'Formulario de Rechazo'}
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Campos específicos para el Director */}
                                {user.role === 'director' && accion === 'aprobar' && (
                                    <>
                                        <MarcasSelector 
                                            selectedMarcas={selectedMarcas} 
                                            onChange={setSelectedMarcas} 
                                        />
                                        <TarifaSelector 
                                            selectedTarifa={selectedTarifa} 
                                            onChange={setSelectedTarifa} 
                                        />
                                    </>
                                )}

                                {/* Campos específicos para Admin */}
                                {user.role === 'admin' && accion === 'aprobar' && (
                                    <TerminosPagoSelector 
                                        selectedTermino={selectedTerminoPago} 
                                        onChange={setSelectedTerminoPago} 
                                    />
                                )}

                                {/* Documento SEPA (si aplica) */}
                                {selectedSolicitudData?.datos_comercial?.metodo_pago === 'REMESA' && (
                                    <div className="space-y-2 mt-4">
                                        <Label className="text-base font-medium">Documento SEPA</Label>
                                        {selectedSolicitudData?.datos_comercial?.sepa_documento ? (
                                            <div className="p-3 bg-gray-50 rounded-md">
                                                <a 
                                                    href={`http://localhost:8000${selectedSolicitudData.datos_comercial.sepa_documento}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center"
                                                >
                                                    Ver documento SEPA
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-yellow-600">No hay documento SEPA disponible</p>
                                        )}
                                    </div>
                                )}

                                {/* Campo de observaciones para todos los roles */}
                                <div className="space-y-2 mt-4">
                                    <Label className="text-base font-medium">Observaciones</Label>
                                    <Textarea
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        placeholder="Añada notas o comentarios..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isApproving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmar}
                            disabled={
                                isApproving || 
                                (user.role === 'director' && accion === 'aprobar' && (selectedMarcas.length === 0 || !selectedTarifa)) || 
                                (user.role === 'admin' && accion === 'aprobar' && !selectedTerminoPago)
                            }
                            className={accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                accion === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default AprobacionSolicitudes;