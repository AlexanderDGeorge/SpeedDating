import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EditEventForm from "../components/EditEventForm";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { calculateAge } from "../utils/dateUtils";
import { Calendar, Clock, Users, UserCheck, UserX } from "lucide-react";
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
    return <Loading fullPage={true} text="Loading event data..." />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || "Event not found"}</div>
          <Button 
            variant="primary"
            onClick={() => navigate("/admin")}
          >
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.start);
  const isPastEvent = eventDate < new Date();
  
  const getEventStatusDisplay = () => {
    if (event.status === 'cancelled') {
      return { text: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' };
    } else if (isPastEvent) {
      return { text: 'Completed', class: 'bg-green-100 text-green-800 border-green-200' };
    } else {
      return { text: 'Upcoming', class: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const eventStatus = getEventStatusDisplay();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header/>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            {/* Status Badge */}
            <div className="flex justify-start mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${eventStatus.class}`}>
                {eventStatus.text}
              </span>
            </div>
            
            {/* Title and Description */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl text-left font-bold text-navy mb-2">{event.title}</h1>
              {event.description && (
                <p className="text-gray-700 text-lg text-left">{event.description}</p>
              )}
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div className="flex items-center text-sm text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Date: </span>
                  <span>{eventDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Time: </span>
                  <span>{eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}</span>
                </div>
              </div>

              {/* Age Range */}
              <div className="flex items-center text-sm text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Age Range: </span>
                  <span>{event.ageRangeMin}{event.ageRangeMax ? ` - ${event.ageRangeMax}` : '+'} years</span>
                </div>
              </div>

              {/* Male Capacity */}
              <div className="flex items-center text-sm text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Male Capacity: </span>
                  <span>{registrations.filter(r => registeredUsers.find(u => u.id === r.userId)?.gender === 'male').length} / {event.maleCapacity}</span>
                </div>
              </div>

              {/* Female Capacity */}
              <div className="flex items-center text-sm text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Female Capacity: </span>
                  <span>{registrations.filter(r => registeredUsers.find(u => u.id === r.userId)?.gender === 'female').length} / {event.femaleCapacity}</span>
                </div>
              </div>


              {/* Checked In */}
              <div className="flex items-center text-sm text-gray-700">
                <UserCheck className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Checked In: </span>
                  <span>{registrations.filter(r => r.status === 'checked-in').length} participants</span>
                </div>
              </div>

              {/* No Shows */}
              <div className="flex items-center text-sm text-gray-700">
                <UserX className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">No Shows: </span>
                  <span>{registrations.filter(r => r.status === 'no-show').length} participants</span>
                </div>
              </div>
            </div>
          </div>

          {/* Registrants Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-navy mb-6">
              {isPastEvent ? 'Event Participants' : 'Registered Users'} ({registrations.length})
            </h2>

            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700">
                      <th className="p-3 border-b text-left font-semibold">Name</th>
                      <th className="p-3 border-b text-left font-semibold">Email</th>
                      <th className="p-3 border-b text-left font-semibold">Age</th>
                      <th className="p-3 border-b text-left font-semibold">Gender</th>
                      <th className="p-3 border-b text-left font-semibold">Status</th>
                      <th className="p-3 border-b text-left font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => {
                      const user = getUserForRegistration(registration.userId);
                      return (
                        <tr key={registration.id} className="hover:bg-gray-50 transition-colors border-b">
                          <td className="p-3">
                            <p className="font-semibold text-gray-900">{user?.name || 'Unknown User'}</p>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{user?.email || 'N/A'}</td>
                          <td className="p-3 text-center text-gray-600">{user?.birthday ? calculateAge(user.birthday) : 'N/A'}</td>
                          <td className="p-3 capitalize text-gray-600">{user?.gender || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(registration.status)}`}>
                              {getStatusText(registration.status)}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
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
            <div className="flex gap-4 justify-center">
              <Button
                variant="secondary"
                onClick={() => setShowEditForm(true)}
              >
                Edit Event
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelEvent}
                loading={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Event"}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}