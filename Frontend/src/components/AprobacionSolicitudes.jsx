import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useAuth } from '../context/AuthContext';
import SolicitudesTable from './SolicitudesTable';
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
        setDialogOpen(true);
    };

    const handleConfirmar = async () => {
        setIsApproving(true);
        try {
            const response = await fetch(`http://localhost:8000/api/solicitudes/${selectedSolicitud}/aprobar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    aprobar: accion === 'aprobar',
                    notas: notas
                })
            });

            if (!response.ok) throw new Error('Error al procesar la solicitud');

            // Actualizar la lista de solicitudes
            await fetchSolicitudes();
            setDialogOpen(false);
            setNotas('');
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {accion === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Notas adicionales
                            </label>
                            <Textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Añada notas o comentarios..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isApproving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmar}
                            disabled={isApproving}
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