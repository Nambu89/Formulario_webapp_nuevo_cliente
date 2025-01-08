export function Alert({ variant = "default", className, ...props }) {
    const variantStyles = {
      default: "bg-gray-100 text-gray-900",
      error: "bg-red-100 text-red-900",
      warning: "bg-yellow-100 text-yellow-900",
      success: "bg-green-100 text-green-900",
    };
  
    return (
      <div
        role="alert"
        className={`relative w-full rounded-lg border p-4 ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
  
  export function AlertDescription({ className, ...props }) {
    return <div className={`text-sm ${className}`} {...props} />;
  }