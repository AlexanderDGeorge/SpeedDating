import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
  glow?: boolean;
}

export default function Button({ 
  variant = "primary", 
  size = "md", 
  fullWidth = false,
  loading = false,
  disabled = false,
  glow = false,
  className = "",
  children,
  ...props 
}: ButtonProps) {
  
  // Base styles that all buttons share
  const baseStyles = "font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center whitespace-nowrap";
  
  // Size variations
  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-lg"
  };
  
  // Variant styles
  const variantStyles = {
    primary: "bg-teal text-white hover:bg-navy",
    secondary: "bg-orange text-white hover:bg-navy", 
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-green-500 text-white hover:bg-green-600",
    warning: "bg-gold text-white hover:bg-navy",
    ghost: "bg-gray-500 text-white hover:bg-gray-600"
  };
  
  // Disabled/loading state
  const disabledStyles = (disabled || loading) 
    ? "bg-gray-400 text-white cursor-not-allowed hover:bg-gray-400" 
    : "";
  
  // Width styles
  const widthStyles = fullWidth ? "w-full" : "";
  
  // Glow effect
  const glowStyles = glow && !disabled && !loading ? "button-glow" : "";
  
  // Combine all styles
  const combinedStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${disabledStyles || variantStyles[variant]}
    ${widthStyles}
    ${glowStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <button
      className={combinedStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {typeof children === 'string' ? `${children}...` : children}
        </>
      ) : (
        children
      )}
    </button>
  );
}