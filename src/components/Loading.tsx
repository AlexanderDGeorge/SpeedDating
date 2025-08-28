interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullPage?: boolean;
}

export default function Loading({ size = "md", text = "Loading...", fullPage = false }: LoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm": return "w-4 h-4";
      case "md": return "w-8 h-8";
      case "lg": return "w-12 h-12";
      default: return "w-8 h-8";
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case "sm": return "text-sm";
      case "md": return "text-lg";
      case "lg": return "text-xl";
      default: return "text-lg";
    }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${getSizeClasses()} border-4 border-gray-200 border-t-orange animate-spin rounded-full`}></div>
      <p className={`text-navy ${getTextSizeClass()} font-medium animate-pulse`}>{text}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Skeleton loading component for content placeholders
export function LoadingSkeleton({ lines = 3, showAvatar = false }: { lines?: number; showAvatar?: boolean }) {
  return (
    <div className="animate-fade-in space-y-4 p-6">
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 skeleton skeleton-avatar"></div>
          <div className="flex-1 space-y-2">
            <div className="skeleton skeleton-title w-1/3"></div>
            <div className="skeleton skeleton-text w-1/2"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={`skeleton skeleton-text ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}></div>
        ))}
      </div>
    </div>
  );
}