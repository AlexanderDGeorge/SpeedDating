import { useNavigate } from "react-router-dom";
import type { SpeedDatingEvent } from "../types/event";

interface EventProps {
  event: SpeedDatingEvent;
  variant: "upcoming" | "past";
  onClick?: () => void;
}

export default function Event({ event, variant, onClick }: EventProps) {
  const navigate = useNavigate();

  const isUpcoming = variant === "upcoming";
  const isCancelled = event.status === 'cancelled';
  
  const getEventStyles = () => {
    if (isCancelled) {
      return {
        container: "bg-cream border-4 border-red-400 p-8 rounded-lg hover:border-red-600 hover:shadow-xl transition-all duration-200 card-hover",
        title: "text-2xl font-bold text-gray-700 mb-2",
        description: "text-gray-600 text-lg mb-6"
      };
    } else if (isUpcoming) {
      return {
        container: "bg-cream border-4 border-teal p-8 rounded-lg hover:border-teal-600 hover:shadow-xl transition-all duration-200 card-hover",
        title: "text-2xl font-bold text-navy mb-2",
        description: "text-gray-700 text-lg mb-6"
      };
    } else {
      // Completed events - green border but normal text
      return {
        container: "bg-cream border-4 border-green-500 p-8 rounded-lg hover:border-green-600 hover:shadow-xl transition-all duration-200 card-hover",
        title: "text-2xl font-bold text-navy mb-2",
        description: "text-gray-700 text-lg mb-6"
      };
    }
  };

  const styles = getEventStyles();
  const containerClass = `${styles.container} cursor-pointer`;
  
  const getStatusDisplay = () => {
    if (isCancelled) {
      return {
        class: "px-4 py-2 rounded-lg font-semibold bg-red-200 text-red-700",
        text: "Cancelled"
      };
    } else if (isUpcoming) {
      return {
        class: "px-4 py-2 rounded-lg font-semibold bg-teal-100 text-teal-700",
        text: "Upcoming"
      };
    } else {
      return {
        class: "px-4 py-2 rounded-lg font-semibold bg-green-200 text-green-800",
        text: "Completed"
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Convert 24-hour time to 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour12 = parseInt(hours);
    const ampm = hour12 >= 12 ? 'PM' : 'AM';
    const displayHour = hour12 % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to event details page for regular users
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <div className={containerClass} onClick={handleClick}>
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h4 className={`${styles.title} text-left`}>{event.title}</h4>
          <div className={statusDisplay.class}>
            {statusDisplay.text}
          </div>
        </div>
        <p className={`${styles.description} text-left`}>{event.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Date</p>
          <p className="font-semibold text-navy">{(() => {
            // Parse the date string and add timezone offset to avoid day shifting
            const [year, month, day] = event.date.split('-').map(num => parseInt(num));
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          })()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Time</p>
          <p className="font-semibold text-navy">{formatTime(event.startTime)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Age Range</p>
          <p className="font-semibold text-navy">{event.ageRangeMin} - {event.ageRangeMax}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 italic text-left">Click for more details</p>
    </div>
  );
}