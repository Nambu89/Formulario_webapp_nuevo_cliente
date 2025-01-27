import React from 'react';
import Layout from '../components/Layout';
import ClienteForm from '../components/ClienteForm';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../components/ui/card';

const NuevoCliente = () => {
    const { user } = useAuth();

    return (
        <Layout>
            <div className="container mx-auto py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                            Sistema de Alta de Nuevos Clientes
                        </CardTitle>
                    </CardHeader>
                    <div className="p-6">
                        <ClienteForm userRole={user.role} />
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default NuevoCliente;