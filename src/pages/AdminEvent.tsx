import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EditEventForm from "../components/EditEventForm";
import EventParticipants from "../components/EventParticipants";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { Calendar, Clock, Users, UserCheck, Mars, Venus } from "lucide-react";
import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";
import type { User } from "../types";
import { fetchEventById, cancelEvent, updateEvent } from "../firebase/event";
import { fetchEventRegistrations, createRegistration, checkInUser } from "../firebase/registration";
import { fetchAllUsers, createUser } from "../firebase/user";

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
  const [addingMockUsers, setAddingMockUsers] = useState(false);
  const [startingEvent, setStartingEvent] = useState(false);
  const [completingEvent, setCompletingEvent] = useState(false);
  const [openingCheckIn, setOpeningCheckIn] = useState(false);
  const [resettingToCheckIn, setResettingToCheckIn] = useState(false);
  const [checkingInAll, setCheckingInAll] = useState(false);


  useEffect(() => {
    fetchEventData();
  }, [eventId]);

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


  const handleCancelEvent = async () => {
    if (!event || !eventId) return;
    
    setCancelLoading(true);
    try {
      await cancelEvent(eventId);
      
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

  const handleAddMockUsers = async () => {
    if (!event || !eventId) return;
    
    setAddingMockUsers(true);
    try {
      // Generate mock users
      const maleNames = ['Alex Johnson', 'Mike Chen', 'David Smith', 'Ryan Wilson', 'Chris Brown'];
      const femaleNames = ['Sarah Jones', 'Emma Wilson', 'Lisa Garcia', 'Amy Thompson', 'Kate Miller'];
      
      const mockUsers = [];
      
      // Add 5 male mock users
      for (let i = 0; i < 5; i++) {
        const mockUser = {
          name: maleNames[i],
          email: `male${i + 1}@mockuser.com`,
          gender: 'male' as const,
          interestedIn: 'women' as const,
          birthday: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          bio: `Mock user ${i + 1} for testing purposes`,
          createdAt: new Date().toISOString(),
          authProvider: 'mock'
        };
        
        const userId = `mock_male_${Date.now()}_${i}`;
        await createUser(userId, mockUser);
        
        // Register the user for the event
        await createRegistration({
          eventId: eventId,
          userId: userId,
          registeredAt: new Date().toISOString(),
          status: 'registered'
        });
        
        mockUsers.push({ ...mockUser, id: userId });
      }
      
      // Add 5 female mock users
      for (let i = 0; i < 5; i++) {
        const mockUser = {
          name: femaleNames[i],
          email: `female${i + 1}@mockuser.com`,
          gender: 'female' as const,
          interestedIn: 'men' as const,
          birthday: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          bio: `Mock user ${i + 1} for testing purposes`,
          createdAt: new Date().toISOString(),
          authProvider: 'mock'
        };
        
        const userId = `mock_female_${Date.now()}_${i}`;
        await createUser(userId, mockUser);
        
        // Register the user for the event
        await createRegistration({
          eventId: eventId,
          userId: userId,
          registeredAt: new Date().toISOString(),
          status: 'registered'
        });
        
        mockUsers.push({ ...mockUser, id: userId });
      }
      
      // Refresh event data to show new registrations
      await fetchEventData();
      
    } catch (err) {
      console.error("Error adding mock users:", err);
      setError("Failed to add mock users. Please try again.");
    } finally {
      setAddingMockUsers(false);
    }
  };

  const handleOpenCheckIn = async () => {
    if (!event || !eventId) return;
    
    if (!confirm("Are you sure you want to open check-in for this event? Participants will be able to check in.")) {
      return;
    }
    
    setOpeningCheckIn(true);
    try {
      await updateEvent(eventId, {
        status: 'checking-in'
      });
      
      // Refresh event data to show updated status
      await fetchEventData();
      
    } catch (err) {
      console.error("Error opening check-in:", err);
      setError("Failed to open check-in. Please try again.");
    } finally {
      setOpeningCheckIn(false);
    }
  };

  const handleStartEvent = async () => {
    if (!event || !eventId) return;
    
    if (!confirm("Are you sure you want to start this event? This will mark it as 'active' and the event will officially begin.")) {
      return;
    }
    
    setStartingEvent(true);
    try {
      await updateEvent(eventId, {
        status: 'active',
        startedAt: new Date().toISOString(),
      });
      
      // Refresh event data to show updated status
      await fetchEventData();
      
    } catch (err) {
      console.error("Error starting event:", err);
      setError("Failed to start event. Please try again.");
    } finally {
      setStartingEvent(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!event || !eventId) return;
    
    if (!confirm("Are you sure you want to complete this event? This will mark it as finished and no further changes can be made.")) {
      return;
    }
    
    setCompletingEvent(true);
    try {
      await updateEvent(eventId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      
      // Refresh event data to show updated status
      await fetchEventData();
      
    } catch (err) {
      console.error("Error completing event:", err);
      setError("Failed to complete event. Please try again.");
    } finally {
      setCompletingEvent(false);
    }
  };

  const handleResetToCheckIn = async () => {
    if (!event || !eventId) return;
    
    if (!confirm("Are you sure you want to reset this event to checking-in status? This will allow participants to check in again.")) {
      return;
    }
    
    setResettingToCheckIn(true);
    try {
      await updateEvent(eventId, {
        status: 'checking-in'
      });
      
      // Refresh event data to show updated status
      await fetchEventData();
      
    } catch (err) {
      console.error("Error resetting to check-in:", err);
      setError("Failed to reset to check-in. Please try again.");
    } finally {
      setResettingToCheckIn(false);
    }
  };

  const handleCheckInAll = async () => {
    if (!event || !eventId) return;
    
    const registeredParticipants = registrations.filter(r => r.status === 'registered');
    
    if (registeredParticipants.length === 0) {
      alert("No registered participants to check in.");
      return;
    }

    if (!confirm(`Are you sure you want to check in all ${registeredParticipants.length} registered participants?`)) {
      return;
    }
    
    setCheckingInAll(true);
    try {
      // Check in all registered participants
      await Promise.all(
        registeredParticipants.map(registration => checkInUser(registration.id))
      );
      
      // Refresh event data to show updated statuses
      await fetchEventData();
      
      alert(`Successfully checked in ${registeredParticipants.length} participants!`);
      
    } catch (err) {
      console.error("Error checking in all participants:", err);
      setError("Failed to check in all participants. Please try again.");
    } finally {
      setCheckingInAll(false);
    }
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
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.start);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header/>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            {/* Title and Status */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl text-left font-bold text-navy mb-2">{event.title}</h1>
                {event.description && (
                  <p className="text-gray-700 text-lg text-left">{event.description}</p>
                )}
              </div>
              <StatusBadge status={event.status} variant="event" />
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
                <Mars className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Male Capacity: </span>
                  <span>{registrations.filter(r => registeredUsers.find(u => u.id === r.userId)?.gender === 'male').length} / {event.maleCapacity}</span>
                </div>
              </div>

              {/* Female Capacity */}
              <div className="flex items-center text-sm text-gray-700">
                <Venus className="w-5 h-5 mr-3 text-gray-500" />
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

            </div>
          </div>

          {/* Event Participants */}
          <EventParticipants 
            event={event}
            registrations={registrations}
            registeredUsers={registeredUsers}
          />

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
          {!showEditForm && event && event.status !== 'cancelled' && event.status !== 'completed' && (
            <div className="flex gap-4 justify-center">
              {event.status === 'upcoming' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowEditForm(true)}
                  >
                    Edit Event
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddMockUsers}
                    loading={addingMockUsers}
                  >
                    {addingMockUsers ? "Adding Mock Users..." : "Add Mock Users"}
                  </Button>
                  <Button
                    variant="warning"
                    onClick={handleOpenCheckIn}
                    loading={openingCheckIn}
                  >
                    {openingCheckIn ? "Opening Check-In..." : "Open Check-In"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleCancelEvent}
                    loading={cancelLoading}
                  >
                    {cancelLoading ? "Cancelling..." : "Cancel Event"}
                  </Button>
                </>
              )}
              {event.status === 'checking-in' && (
                <>
                  <Button
                    variant="primary"
                    onClick={handleCheckInAll}
                    loading={checkingInAll}
                  >
                    {checkingInAll ? "Checking In All..." : "Check In All"}
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleStartEvent}
                    loading={startingEvent}
                  >
                    {startingEvent ? "Starting Event..." : "Start Event"}
                  </Button>
                </>
              )}
              {event.status === 'active' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/event/${eventId}/matching`)}
                  >
                    Manage Matching
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleResetToCheckIn}
                    loading={resettingToCheckIn}
                  >
                    {resettingToCheckIn ? "Resetting..." : "Back to Check-In"}
                  </Button>
                  <Button
                    variant="warning"
                    onClick={handleCompleteEvent}
                    loading={completingEvent}
                  >
                    {completingEvent ? "Completing Event..." : "Complete Event"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

