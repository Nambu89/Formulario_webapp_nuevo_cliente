export function Label({ className, ...props }) {
    return (
      <label
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed 
          peer-disabled:opacity-70 ${className}`}
        {...props}
      />
    );
  }