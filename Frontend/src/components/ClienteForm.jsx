import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ClienteWorkflow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Datos del comercial
    nombre: '',
    nombreComercial: '',
    direccion: '',
    poblacion: '',
    codigoPostal: '',
    nombreContacto: '',
    telefono: '',
    correo: '',
    web: '',
    cifNif: '',
    tipoCarga: '',
    sepaDocumento: null,
    
    // Datos del director comercial
    condicionesEnvio: '',
    condicionesEntrega: '',
    requierePlataforma: false,
    tipoEnvio: '',
    horario: '',
    tipoDescarga: ''
  });

  const [errors, setErrors] = useState({});

  const validateComercialForm = () => {
    const newErrors = {};
    const requiredFields = [
      'nombre', 'direccion', 'poblacion', 'codigoPostal',
      'nombreContacto', 'telefono', 'correo', 'cifNif', 'tipoCarga'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'Este campo es obligatorio';
      }
    });

    if (!formData.sepaDocumento) {
      newErrors.sepaDocumento = 'Debe adjuntar el documento SEPA';
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

    setIsSubmitting(true);
    try {
      // Primero, subimos el documento SEPA si existe
      let sepaUrl = null;
      if (formData.sepaDocumento) {
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

      // Luego, enviamos los datos del formulario
      const response = await fetch('http://localhost:8000/api/solicitudes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          sepaDocumento: sepaUrl
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear la solicitud');
      }

      // Si todo sale bien, navegamos a la página de solicitudes
      navigate('/mis-solicitudes');
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateComercialForm()) {
        handleSubmit();
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alta de Nuevo Cliente - Paso {currentStep} de 4</CardTitle>
        </CardHeader>
        <CardContent>
          {errors.submit && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {currentStep === 1 && (
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                {/* Los campos que ya tenías */}
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
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
                  <Label htmlFor="tipoCarga">Tipo de Carga</Label>
                  <Select 
                    id="tipoCarga"
                    value={formData.tipoCarga}
                    onChange={(e) => handleChange('tipoCarga', e.target.value)}
                  >
                    <option value="">Seleccione tipo de carga</option>
                    <option value="COMP">COMP</option>
                    <option value="CROSS">CROSS</option>
                    <option value="EXW">EXW</option>
                    <option value="GRUP">GRUP</option>
                    <option value="TTPRO">TTPRO</option>
                  </Select>
                </div>

                {/* Resto de campos */}
              </div>

              <div className="mt-4">
                <Label>Documento SEPA</Label>
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
                </div>
              </div>
            </form>
          )}

          {/* Botones de navegación */}
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClienteWorkflow;