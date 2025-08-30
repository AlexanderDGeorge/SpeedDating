import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EditEventForm from "../components/EditEventForm";
import { calculateAge } from "../utils/dateUtils";
import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";
import type { User } from "../types";
import { fetchEventById, cancelEvent } from "../firebase/event";
import { fetchEventRegistrations } from "../firebase/registration";
import { fetchAllUsers } from "../firebase/user";
import { useAuth } from "../contexts/AuthContext";

export default function AdminEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SpeedDatingEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchEventData();
  }, [currentUser, isAdmin, eventId, navigate]);

  const fetchEventData = async () => {
    if (!eventId) {
      setError("Event ID not found");
      setLoading(false);
      return;
    }

    try {
      // Fetch event details
      const eventData = await fetchEventById(eventId);
      if (!eventData) {
        setError("Event not found");
        setLoading(false);
        return;
      }
      setEvent(eventData);

      // Fetch real registrations for this event
      const registrationsData = await fetchEventRegistrations(eventId);
      setRegistrations(registrationsData);
      
      // Get user data for registered users
      if (registrationsData.length > 0) {
        const allUsersData = await fetchAllUsers();
        const registeredUserData = allUsersData.filter(user => 
          registrationsData.some(reg => reg.userId === user.id)
        );
        setRegisteredUsers(registeredUserData);
      } else {
        setRegisteredUsers([]);
      }
    } catch (err) {
      console.error("Error fetching event data:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: EventRegistration['status']) => {
    switch (status) {
      case 'registered': return 'text-blue-600 bg-blue-100';
      case 'checked-in': return 'text-green-600 bg-green-100';
      case 'no-show': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: EventRegistration['status']) => {
    switch (status) {
      case 'registered': return 'Registered';
      case 'checked-in': return 'Checked In';
      case 'no-show': return 'No Show';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getUserForRegistration = (userId: string): User | undefined => {
    return registeredUsers.find(user => user.id === userId);
  };

  const handleCancelEvent = async () => {
    if (!event || !eventId) return;
    
    setCancelLoading(true);
    try {
      await cancelEvent(eventId, auth.currentUser?.uid || '');
      
      // Refresh event data
      await fetchEventData();
    } catch (err) {
      console.error("Error cancelling event:", err);
      setError("Failed to cancel event. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleEventUpdated = async () => {
    setShowEditForm(false);
    await fetchEventData(); // Refresh event data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-xl">Loading event data...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || "Event not found"}</div>
          <button
            onClick={() => navigate("/admin")}
            className="bg-navy text-white px-6 py-2 rounded hover:bg-orange transition-colors"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPastEvent = new Date(event.date) < new Date();
  
  const getEventStatusDisplay = () => {
    if (event.status === 'cancelled') {
      return { text: 'Cancelled', class: 'bg-red-200 text-red-700' };
    } else if (isPastEvent) {
      return { text: 'Completed', class: 'bg-gray-200 text-gray-700' };
    } else {
      return { text: 'Upcoming', class: 'bg-green-100 text-green-700' };
    }
  };

  const eventStatus = getEventStatusDisplay();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header/>

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          {/* Event Info */}
          <div className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-left text-navy mb-2">{event.title}</h1>
                <p className="text-gray-700 text-lg text-left">{event.description}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${eventStatus.class}`}>
                {eventStatus.text}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Date</p>
                <p className="font-semibold text-navy whitespace-pre-line">{(() => {
                  // Parse the date string and add timezone offset to avoid day shifting
                  const [year, month, day] = event.date.split('-').map(num => parseInt(num));
                  const date = new Date(year, month - 1, day); // month is 0-indexed
                  const formatted = date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  return formatted.replace(/^(\w+), /, '$1,\n');
                })()}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Time</p>
                <p className="font-semibold text-navy">{(() => {
                  const [hours, minutes] = event.startTime.split(':');
                  const hour12 = parseInt(hours);
                  const ampm = hour12 >= 12 ? 'PM' : 'AM';
                  const displayHour = hour12 % 12 || 12;
                  return `${displayHour}:${minutes} ${ampm}`;
                })()}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Male Capacity</p>
                <p className="font-semibold text-navy">{registrations.filter(r => registeredUsers.find(u => u.id === r.userId)?.gender === 'male').length} / {event.maleCapacity}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Female Capacity</p>
                <p className="font-semibold text-navy">{registrations.filter(r => registeredUsers.find(u => u.id === r.userId)?.gender === 'female').length} / {event.femaleCapacity}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Age Range</p>
                <p className="font-semibold text-navy">{event.ageRangeMin}{event.ageRangeMax ? ` - ${event.ageRangeMax}` : '+'}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Registration Deadline</p>
                <p className="font-semibold text-navy whitespace-pre-line">{(() => {
                  // Parse the date string and add timezone offset to avoid day shifting
                  const [year, month, day] = event.registrationDeadline.split('-').map(num => parseInt(num));
                  const date = new Date(year, month - 1, day); // month is 0-indexed
                  const formatted = date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  return formatted.replace(/^(\w+), /, '$1,\n');
                })()}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Checked In</p>
                <p className="font-semibold text-navy">{registrations.filter(r => r.status === 'checked-in').length}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">No Shows</p>
                <p className="font-semibold text-navy">{registrations.filter(r => r.status === 'no-show').length}</p>
              </div>
            </div>
          </div>

          {/* Registrants Table */}
          <div className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-navy mb-6">
              {isPastEvent ? 'Event Participants' : 'Registered Users'} ({registrations.length})
            </h2>

            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-navy text-white">
                      <th className="p-3 border text-left">Name</th>
                      <th className="p-3 border text-left">Email</th>
                      <th className="p-3 border text-left">Age</th>
                      <th className="p-3 border text-left">Gender</th>
                      <th className="p-3 border text-left">Status</th>
                      <th className="p-3 border text-left">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => {
                      const user = getUserForRegistration(registration.userId);
                      return (
                        <tr key={registration.id} className="bg-cream hover:bg-white transition-colors">
                          <td className="p-3 border">
                            <p className="font-semibold text-navy">{user?.name || 'Unknown User'}</p>
                          </td>
                          <td className="p-3 border text-sm">{user?.email || 'N/A'}</td>
                          <td className="p-3 border text-center">{user?.birthday ? calculateAge(user.birthday) : 'N/A'}</td>
                          <td className="p-3 border capitalize">{user?.gender || 'N/A'}</td>
                          <td className="p-3 border">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(registration.status)}`}>
                              {getStatusText(registration.status)}
                            </span>
                          </td>
                          <td className="p-3 border text-sm">
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

          {/* Edit Event Form */}
          {showEditForm && event && (
            <div className="mt-8">
              <EditEventForm 
                event={event}
                onEventUpdated={handleEventUpdated}
                onCancel={() => setShowEditForm(false)}
              />
            </div>
          )}

          {/* Admin Action Buttons */}
          {!showEditForm && event && event.status !== 'cancelled' && !isPastEvent && (
            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={() => setShowEditForm(true)}
                className="bg-orange text-white px-6 py-3 rounded-lg hover:bg-navy transition-colors font-semibold"
              >
                Edit Event
              </button>
              <button
                onClick={handleCancelEvent}
                disabled={cancelLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  cancelLoading 
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Event"}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}