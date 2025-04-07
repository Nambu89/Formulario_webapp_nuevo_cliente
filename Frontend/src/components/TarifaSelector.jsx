// src/components/TarifaSelector.jsx
import React from 'react';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

// Selector de tarifas actualizado con la nueva tarifa GDGDZLM
const TarifaSelector = ({ selectedTarifa, onChange }) => {
    const tarifas = [
        { id: 'XEGC', label: 'XEGC' },
        { id: 'DZLM', label: 'DZLM' },
        { id: 'AFDZLM', label: 'AFDZLM' },
        { id: 'WJPI', label: 'WJPI' },
        { id: 'GDGDZLM', label: 'GDGDZLM' } // Nueva tarifa añadida
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

export default TarifaSelector;