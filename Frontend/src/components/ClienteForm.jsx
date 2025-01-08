import React, { useState } from 'react'; // Añade useState aquí
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Upload } from 'lucide-react';
const ClienteWorkflow = () => {
  // Estados para los diferentes pasos del formulario
  const [currentStep, setCurrentStep] = useState(1);
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

  // Estado para validación
  const [errors, setErrors] = useState({});

  // Función para validar el formulario del comercial
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

  // Manejador para el cambio de campos
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejador para el siguiente paso
  const handleNext = () => {
    if (currentStep === 1 && !validateComercialForm()) {
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alta de Nuevo Cliente - Paso {currentStep} de 4</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

                {/* Resto de campos del comercial */}
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
                </div>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <Alert>
              <AlertDescription>
                Esperando validación del Director Comercial
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de navegación */}
          <div className="mt-6 flex justify-end space-x-4">
            {currentStep < 4 && (
              <Button onClick={handleNext}>
                Siguiente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClienteWorkflow;