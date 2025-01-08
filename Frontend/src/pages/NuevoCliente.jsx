import React from 'react';
import ClienteForm from '../components/ClienteForm';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../components/ui/card';

const NuevoCliente = () => {
    const { user, role } = useAuth();

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Sistema de Alta de Nuevos Clientes
                    </CardTitle>
                </CardHeader>
                <div className="p-6">
                    <ClienteForm userRole={role} />
                </div>
            </Card>
        </div>
    );
};

export default NuevoCliente;