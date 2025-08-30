import { useNavigate } from "react-router-dom";
import type { SpeedDatingEvent } from "../types/event";
import { Calendar, Clock, Users } from "lucide-react";

interface EventProps {
  event: SpeedDatingEvent;
  onClick?: () => void;
}

export default function Event({ event, onClick }: EventProps) {
  const navigate = useNavigate();

  const eventDate = new Date(event.start);
  const isPastEvent = eventDate < new Date();
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed' || isPastEvent;
  const isUpcoming = !isPastEvent && !isCancelled && !isCompleted;
  
  const getStatusConfig = () => {
    if (isCancelled) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        text: "Cancelled"
      };
    } else if (isUpcoming) {
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        text: "Upcoming"
      };
    } else {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        text: "Completed"
      };
    }
  };

  const statusConfig = getStatusConfig();


  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to event details page for regular users
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleClick}
    >
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
          {statusConfig.text}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl text-left font-semibold text-gray-900 mb-3">
        {event.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-left mb-4">
        {event.description}
      </p>

      {/* Event Details */}
      <div className="space-y-3 flex-grow">
        {/* Date */}
        <div className="flex items-center text-sm text-gray-700">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <span>{eventDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>

        {/* Time */}
        <div className="flex items-center text-sm text-gray-700">
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          <span>{eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}</span>
        </div>

        {/* Age Range */}
        <div className="flex items-center text-sm text-gray-700">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <span>Ages {event.ageRangeMin}{event.ageRangeMax ? `-${event.ageRangeMax}` : '+'}</span>
        </div>
      </div>

      {/* Click for details text */}
      <p className="text-xs text-gray-500 italic text-center mt-auto">Click for more details</p>
    </div>
  );
}