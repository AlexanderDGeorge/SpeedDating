import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";

interface StatusBadgeProps {
  status: SpeedDatingEvent['status'] | EventRegistration['status'] | 'full' | 'open';
  variant?: 'event' | 'registration';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, variant = 'event', size = 'md' }: StatusBadgeProps) {
  const getStatusDisplay = () => {
    // Event statuses
    if (variant === 'event') {
      switch (status) {
        case 'cancelled':
          return { text: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' };
        case 'completed':
          return { text: 'Completed', class: 'bg-gray-100 text-gray-800 border-gray-200' };
        case 'active':
          return { text: 'Active', class: 'bg-green-100 text-green-800 border-green-200' };
        case 'checking-in':
          return { text: 'Check-In Open', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        case 'upcoming':
          return { text: 'Upcoming', class: 'bg-blue-100 text-blue-800 border-blue-200' };
        case 'full':
          return { text: 'Full', class: 'bg-orange-100 text-orange-800 border-orange-200' };
        case 'open':
          return { text: 'Open for Registration', class: 'bg-blue-100 text-blue-800 border-blue-200' };
        default:
          return { text: 'Unknown', class: 'bg-gray-100 text-gray-800 border-gray-200' };
      }
    }
    
    // Registration statuses
    switch (status) {
      case 'registered':
        return { text: 'Registered', class: 'bg-blue-100 text-blue-600 border-blue-200' };
      case 'checked-in':
        return { text: 'Checked In', class: 'bg-green-100 text-green-600 border-green-200' };
      case 'cancelled':
        return { text: 'Cancelled', class: 'bg-gray-100 text-gray-600 border-gray-200' };
      default:
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${statusDisplay.class} ${getSizeClasses()} whitespace-nowrap`}>
      {statusDisplay.text}
    </span>
  );
}