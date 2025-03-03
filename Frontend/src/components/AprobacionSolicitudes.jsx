import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useAuth } from '../context/AuthContext';
import SolicitudesTable from './SolicitudesTable';
import { Loader2, Check } from 'lucide-react';
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
import { Checkbox } from './ui/checkbox'; // Asumiendo que tienes un componente Checkbox

// Nuevo componente para el selector de marcas
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

// Nuevo componente para selector de tarifa
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

const AprobacionSolicitudes = () => {
    const { user } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [notas, setNotas] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [accion, setAccion] = useState(null);
    
    // Nuevos estados para los campos del director
    const [selectedMarcas, setSelectedMarcas] = useState([]);
    const [selectedTarifa, setSelectedTarifa] = useState('');

    useEffect(() => {
        fetchSolicitudes();
    }, [user.rol]);

    const fetchSolicitudes = async () => {
        try {
            const response = await fetch(
                `http://localhost:8000/api/solicitudes/pendientes/${user.rol}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (!response.ok) throw new Error('Error al cargar solicitudes pendientes');
            const data = await response.json();
            setSolicitudes(data);
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAprobarRechazar = (solicitudId, esAprobacion) => {
        setSelectedSolicitud(solicitudId);
        setAccion(esAprobacion ? 'aprobar' : 'rechazar');
        // Reiniciar los valores al abrir el diálogo
        setNotas('');
        setSelectedMarcas([]);
        setSelectedTarifa('');
        setDialogOpen(true);
    };

    const handleConfirmar = async () => {
        setIsApproving(true);
        try {
            // Crear objeto con datos adicionales para cuando es director
            const datosAprobacion = {
                aprobar: accion === 'aprobar',
                notas: notas
            };

            // Añadir información específica del director
            if (user.rol === 'director' && accion === 'aprobar') {
                if (selectedMarcas.length === 0) {
                    throw new Error('Debe seleccionar al menos una marca');
                }
                if (!selectedTarifa) {
                    throw new Error('Debe seleccionar una tarifa');
                }
                
                datosAprobacion.marcas = selectedMarcas;
                datosAprobacion.tarifa = selectedTarifa;
            }

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

            // Actualizar la lista de solicitudes
            await fetchSolicitudes();
            setDialogOpen(false);
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
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Solicitudes Pendientes de {user.rol === 'director' ? 'Director' : 
                                                     user.rol === 'pedidos' ? 'Pedidos' : 
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {accion === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Campos específicos para el Director Comercial */}
                        {user.rol === 'director' && accion === 'aprobar' && (
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

                        {/* Campo de Observaciones para todos los roles */}
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Observaciones</Label>
                            <Textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Añada notas o comentarios..."
                                className="min-h-[100px]"
                            />
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
                            disabled={isApproving || (user.rol === 'director' && accion === 'aprobar' && (selectedMarcas.length === 0 || !selectedTarifa))}
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