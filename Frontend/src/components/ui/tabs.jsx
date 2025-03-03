import React, { useState, createContext, useContext } from "react";

// Contexto para la pestaña activa
const TabsContext = createContext(null);

// Componente principal Tabs
export const Tabs = ({ value, onValueChange, children, className = "", ...props }) => {
  const [activeTab, setActiveTab] = useState(value);

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, handleTabChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Lista de pestañas
export const TabsList = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Trigger de pestaña
export const TabsTrigger = ({ value, children, className = "", ...props }) => {
  const { activeTab, handleTabChange } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? "bg-white text-gray-950 shadow-sm"
          : "hover:bg-gray-200 hover:text-gray-900"
      } ${className}`}
      onClick={() => handleTabChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

// Contenido de pestaña
export const TabsContent = ({ value, children, className = "", ...props }) => {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      className={`mt-2 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};