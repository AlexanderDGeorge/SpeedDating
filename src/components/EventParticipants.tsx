import { calculateAge } from "../utils/dateUtils";
import StatusBadge from "./StatusBadge";
import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";
import type { User } from "../types";

interface EventParticipantsProps {
  event: SpeedDatingEvent;
  registrations: EventRegistration[];
  registeredUsers: User[];
}

export default function EventParticipants({ event, registrations, registeredUsers }: EventParticipantsProps) {
  const eventDate = new Date(event.start);
  const isPastEvent = eventDate < new Date();

  const getUserForRegistration = (userId: string): User | undefined => {
    return registeredUsers.find(user => user.id === userId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-2xl text-left font-bold text-navy mb-6">
        {isPastEvent ? 'Event Participants' : 'Registered Users'} ({registrations.length})
      </h2>
      {registrations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-700">
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="hidden sm:block p-3 text-left font-semibold">Email</th>
                <th className="p-3 text-left font-semibold">Age</th>
                <th className="p-3 text-left font-semibold">Gender</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="hidden sm:block p-3 text-left font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => {
                const user = getUserForRegistration(registration.userId);
                return (
                  <tr key={registration.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="p-3">
                      <p className="text-left text-gray-900">{user?.name || 'Unknown User'}</p>
                    </td>
                    <td className="hidden sm:block p-3 text-left text-sm text-gray-600">{user?.email || 'N/A'}</td>
                    <td className="p-3 text-left text-gray-600">{user?.birthday ? calculateAge(user.birthday) : 'N/A'}</td>
                    <td className="p-3 text-left capitalize text-gray-600">{user?.gender || 'N/A'}</td>
                    <td className="p-3 text-left">
                      <StatusBadge status={registration.status} variant="registration" size="sm" />
                    </td>
                    <td className="hidden sm:block p-3 text-left text-sm text-gray-600">
                      {new Date(registration.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">
          <p>No registrations for this event yet.</p>
        </div>
      )}
    </div>
  );
}