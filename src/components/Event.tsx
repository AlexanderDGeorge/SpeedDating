import { useNavigate } from "react-router-dom";
import type { SpeedDatingEvent } from "../types/event";

interface EventProps {
  event: SpeedDatingEvent;
  variant: "upcoming" | "past";
}

export default function Event({ event, variant }: EventProps) {
  const navigate = useNavigate();

  const isUpcoming = variant === "upcoming";
  const containerClass = isUpcoming 
    ? "bg-white border-4 border-teal p-8 rounded-lg shadow-lg hover:border-orange hover:shadow-xl transition-all duration-200 cursor-pointer"
    : "bg-white border-4 border-gray-400 p-8 rounded-lg shadow-lg hover:border-gray-600 hover:shadow-xl transition-all duration-200 cursor-pointer";
  
  const titleClass = isUpcoming 
    ? "text-2xl font-bold text-navy mb-2"
    : "text-2xl font-bold text-gray-700 mb-2";
  
  const descriptionClass = isUpcoming 
    ? "text-gray-700 text-lg mb-6"
    : "text-gray-600 text-lg mb-6";
  
  const statusBadgeClass = isUpcoming 
    ? "px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700"
    : "px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700";
  
  const statusText = isUpcoming ? "Upcoming" : "Completed";

  // Convert 24-hour time to 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour12 = parseInt(hours);
    const ampm = hour12 >= 12 ? 'PM' : 'AM';
    const displayHour = hour12 % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={containerClass} onClick={() => navigate(`/admin/event/${event.id}`)}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className={titleClass}>{event.title}</h4>
          <p className={descriptionClass}>{event.description}</p>
        </div>
        <div className={statusBadgeClass}>
          {statusText}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cream p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Date</p>
          <p className="font-semibold text-navy">{new Date(event.date).toLocaleDateString()}</p>
        </div>
        <div className="bg-cream p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Time</p>
          <p className="font-semibold text-navy">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
        </div>
        <div className="bg-cream p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Max Participants</p>
          <p className="font-semibold text-navy">{event.maxParticipants} people</p>
        </div>
        <div className="bg-cream p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Age Range</p>
          <p className="font-semibold text-navy">{event.ageRangeMin} - {event.ageRangeMax}</p>
        </div>
        <div className="bg-cream p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Registration Deadline</p>
          <p className="font-semibold text-navy">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}