import React, { useState } from 'react';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClienteForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    poblacion: '',
    codigoPostal: '',
    nombreContacto: '',
    telefono: '',
    correo: '',
    cif_nif: '',
    tipoCarga: '',
    metodoPago: '',
    sepaDocumento: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateComercialForm = () => {
    const newErrors = {};
    const requiredFields = [
      'nombre', 'direccion', 'poblacion', 'codigoPostal',
      'nombreContacto', 'telefono', 'correo', 'cif_nif', 'tipoCarga', 'metodoPago'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'Este campo es obligatorio';
      }
    });

    // Validar documento SEPA solo si el método de pago es REMESA
    if (formData.metodoPago === 'REMESA' && !formData.sepaDocumento) {
      newErrors.sepaDocumento = 'Debe adjuntar el documento SEPA para el método de pago REMESA';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateComercialForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Primero subimos el documento SEPA si es necesario
      let sepaUrl = null;
      if (formData.metodoPago === 'REMESA' && formData.sepaDocumento) {
        const formDataFile = new FormData();
        formDataFile.append('file', formData.sepaDocumento);
        const fileResponse = await fetch('http://localhost:8000/api/upload/sepa', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataFile
        });
        
        if (!fileResponse.ok) throw new Error('Error al subir el documento SEPA');
        const fileData = await fileResponse.json();
        sepaUrl = fileData.url;
      }

      // Luego enviamos los datos del formulario
      const response = await fetch('http://localhost:8000/api/solicitudes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          sepa_documento: sepaUrl
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear la solicitud');
      }

      const data = await response.json();
      console.log('Solicitud creada:', data);
      
      // Avanzamos al siguiente paso
      setCurrentStep(prev => prev + 1);

    } catch (error) {
      console.error('Error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Error al crear la solicitud: ' + error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Sistema de Alta de Nuevos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentStep === step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <h2 className="text-xl font-semibold mb-4">
                Alta de Nuevo Cliente - Paso {currentStep} de 4
              </h2>
            </div>

            {currentStep === 1 && (
              <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className={errors.nombre ? 'border-red-500' : ''}
                    />
                    {errors.nombre && (
                      <span className="text-sm text-red-500">{errors.nombre}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoCarga">Tipo de Carga *</Label>
                    <Select 
                      id="tipoCarga"
                      value={formData.tipoCarga}
                      onChange={(e) => handleChange('tipoCarga', e.target.value)}
                    >
                      <option value="">Seleccione tipo de carga</option>
                      <option value="COMP">COMP</option>
                      <option value="CROSS">CROSS</option>
                      <option value="GRUP">GRUP</option>
                    </Select>
                    {errors.tipoCarga && (
                      <span className="text-sm text-red-500">{errors.tipoCarga}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección *</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      className={errors.direccion ? 'border-red-500' : ''}
                    />
                    {errors.direccion && (
                      <span className="text-sm text-red-500">{errors.direccion}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poblacion">Población *</Label>
                    <Input
                      id="poblacion"
                      value={formData.poblacion}
                      onChange={(e) => handleChange('poblacion', e.target.value)}
                      className={errors.poblacion ? 'border-red-500' : ''}
                    />
                    {errors.poblacion && (
                      <span className="text-sm text-red-500">{errors.poblacion}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código Postal *</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={(e) => handleChange('codigoPostal', e.target.value)}
                      className={errors.codigoPostal ? 'border-red-500' : ''}
                    />
                    {errors.codigoPostal && (
                      <span className="text-sm text-red-500">{errors.codigoPostal}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cif_nif">CIF/NIF *</Label>
                    <Input
                      id="cif_nif"
                      value={formData.cif_nif}
                      onChange={(e) => handleChange('cif_nif', e.target.value)}
                      className={errors.cif_nif ? 'border-red-500' : ''}
                    />
                    {errors.cif_nif && (
                      <span className="text-sm text-red-500">{errors.cif_nif}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombreContacto">Nombre Contacto *</Label>
                    <Input
                      id="nombreContacto"
                      value={formData.nombreContacto}
                      onChange={(e) => handleChange('nombreContacto', e.target.value)}
                      className={errors.nombreContacto ? 'border-red-500' : ''}
                    />
                    {errors.nombreContacto && (
                      <span className="text-sm text-red-500">{errors.nombreContacto}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      className={errors.telefono ? 'border-red-500' : ''}
                    />
                    {errors.telefono && (
                      <span className="text-sm text-red-500">{errors.telefono}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico *</Label>
                    <Input
                      id="correo"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => handleChange('correo', e.target.value)}
                      className={errors.correo ? 'border-red-500' : ''}
                    />
                    {errors.correo && (
                      <span className="text-sm text-red-500">{errors.correo}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metodoPago">Método de Pago *</Label>
                    <Select 
                      id="metodoPago"
                      value={formData.metodoPago}
                      onChange={(e) => handleChange('metodoPago', e.target.value)}
                      className={errors.metodoPago ? 'border-red-500' : ''}
                    >
                      <option value="">Seleccione método de pago</option>
                      <option value="REMESA">REMESA</option>
                      <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    </Select>
                    {errors.metodoPago && (
                      <span className="text-sm text-red-500">{errors.metodoPago}</span>
                    )}
                  </div>
                </div>

                {/* Campo para documento SEPA - solo visible si metodoPago es REMESA */}
                {formData.metodoPago === 'REMESA' && (
                  <div className="mt-6">
                    <Label>Documento SEPA *</Label>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('sepa-upload').click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Subir documento SEPA
                      </Button>
                      <input
                        id="sepa-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => handleChange('sepaDocumento', e.target.files[0])}
                      />
                      {formData.sepaDocumento && (
                        <p className="mt-2 text-sm text-gray-600">
                          Archivo seleccionado: {formData.sepaDocumento.name}
                        </p>
                      )}
                      {errors.sepaDocumento && (
                        <span className="text-sm text-red-500 block mt-1">{errors.sepaDocumento}</span>
                      )}
                    </div>
                  </div>
                )}

                {errors.submit && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end mt-8">
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            )}

            {currentStep === 2 && (
              <Alert>
                <AlertDescription>
                  Solicitud enviada correctamente. Esperando validación del Director Comercial.
                  <div className="mt-4">
                    <Button onClick={() => navigate('/mis-solicitudes')}>
                      Ver Mis Solicitudes
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClienteForm;