import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { calculateAge } from "../utils/dateUtils";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";
import { fetchEventById } from "../firebase/event";
import { fetchUserRegistration, fetchEventRegistrationsByGender, createRegistration, cancelRegistration, checkInUser } from "../firebase/registration";
import { useAuth } from "../contexts/AuthContext";

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SpeedDatingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [maleRegistrationCount, setMaleRegistrationCount] = useState(0);
  const [femaleRegistrationCount, setFemaleRegistrationCount] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userRegistrationId, setUserRegistrationId] = useState<string | null>(null);

  const { currentUser, userProfile, isAdmin } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    // Check if user is admin (admins should use the admin event page)
    if (isAdmin) {
      navigate(`/admin/event/${eventId}`);
      return;
    }

    fetchEventData(currentUser.uid);
  }, [currentUser, isAdmin, eventId, navigate]);

  const fetchEventData = async (userId: string) => {
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

      // Check if user is registered for this event
      const { isRegistered: registered, registrationId } = await fetchUserRegistration(eventId, userId);
      setIsRegistered(registered);
      if (registrationId) {
        setUserRegistrationId(registrationId);
      }

      // Get registration counts by gender
      const { maleCount, femaleCount } = await fetchEventRegistrationsByGender(eventId);
      setMaleRegistrationCount(maleCount);
      setFemaleRegistrationCount(femaleCount);

    } catch (err) {
      console.error("Error fetching event data:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event || !currentUser || !userProfile) return;

    setRegistering(true);
    try {
      // Check if event is full based on user's gender
      const userGender = userProfile?.gender;
      const capacity = userGender === 'male' ? event.maleCapacity : event.femaleCapacity;
      const currentCount = userGender === 'male' ? maleRegistrationCount : femaleRegistrationCount;
      
      if (currentCount >= capacity) {
        alert("Sorry, this event is full for your gender group!");
        return;
      }

      // Check if event has already started
      if (new Date(event.start) < new Date()) {
        alert("Registration is closed as the event has already started.");
        return;
      }

      // Check age requirements
      if (userProfile?.birthday) {
        const age = calculateAge(userProfile.birthday);
        if (age < event.ageRangeMin || (event.ageRangeMax && age > event.ageRangeMax)) {
          const ageRangeText = event.ageRangeMax ? `${event.ageRangeMin}-${event.ageRangeMax}` : `${event.ageRangeMin}+`;
          alert(`This event is for ages ${ageRangeText}. You do not meet the age requirements.`);
          return;
        }
      }

      // Create registration
      const registrationData: Omit<EventRegistration, 'id'> = {
        eventId: eventId!,
        userId: currentUser.uid,
        registeredAt: new Date().toISOString(),
        status: 'registered'
      };

      await createRegistration(registrationData);
      
      setIsRegistered(true);
      if (userProfile?.gender === 'male') {
        setMaleRegistrationCount(prev => prev + 1);
      } else {
        setFemaleRegistrationCount(prev => prev + 1);
      }
      alert("Successfully registered for the event!");
      
    } catch (err) {
      console.error("Error registering for event:", err);
      alert("Failed to register for the event. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!eventId || !currentUser) return;

    if (!confirm("Are you sure you want to cancel your registration?")) return;

    setRegistering(true);
    try {
      await cancelRegistration(eventId, currentUser.uid);
      
      setIsRegistered(false);
      if (userProfile?.gender === 'male') {
        setMaleRegistrationCount(prev => prev - 1);
      } else if (userProfile) {
        setFemaleRegistrationCount(prev => prev - 1);
      }
      alert("Your registration has been cancelled.");
      
    } catch (err) {
      console.error("Error cancelling registration:", err);
      alert("Failed to cancel registration. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    if (!userRegistrationId) return;

    setCheckingIn(true);
    try {
      await checkInUser(userRegistrationId);
      
      alert("Successfully checked in for the event!");
      
    } catch (err) {
      console.error("Error checking in:", err);
      alert("Failed to check in. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return <Loading fullPage={true} text="Loading event details..." />;
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
  const isPastEvent = eventDate < new Date();
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  const isRegistrationClosed = new Date(event.start) < new Date();
  const userGender = userProfile?.gender;
  const capacity = userGender === 'male' ? event.maleCapacity : event.femaleCapacity;
  const currentGenderCount = userGender === 'male' ? maleRegistrationCount : femaleRegistrationCount;
  const isFull = currentGenderCount >= capacity;
  const userAge = userProfile?.birthday ? calculateAge(userProfile.birthday) : 0;
  const meetsAgeRequirement = userProfile && userAge >= event.ageRangeMin && (!event.ageRangeMax || userAge <= event.ageRangeMax);
  const canRegister = !isPastEvent && !isCancelled && !isRegistrationClosed && !isFull && !isRegistered && meetsAgeRequirement;

  // Check if check-in button should be shown (for registered users)
  const showCheckInButton = isRegistered && !isPastEvent && !isCancelled && !isCompleted;
  
  // Check if check-in is enabled (15 minutes before event start)
  const canCheckIn = (() => {
    if (!showCheckInButton) return false;
    
    // Parse event date and start time from ISO string
    const eventDateTime = new Date(event.start);
    
    // Check if current time is within 15 minutes of event start
    const now = new Date();
    const timeDiff = eventDateTime.getTime() - now.getTime();
    const minutesUntilEvent = timeDiff / (1000 * 60);
    
    return minutesUntilEvent <= 15 && minutesUntilEvent > -60; // Available 15 min before to 60 min after start
  })();


  const getEventStatus = () => {
    if (isCancelled) return { text: 'Cancelled', class: 'bg-red-200 text-red-700' };
    if (isPastEvent) return { text: 'Completed', class: 'bg-green-200 text-green-800' };
    if (isFull) return { text: 'Full', class: 'bg-orange-200 text-orange-800' };
    if (isRegistrationClosed) return { text: 'Event Started', class: 'bg-gray-200 text-gray-700' };
    return { text: 'Open for Registration', class: 'bg-teal-100 text-teal-700' };
  };

  const eventStatus = getEventStatus();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Event Details Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl text-left font-bold text-navy mb-2">{event.title}</h1>
                {event.description && (
                  <p className="text-gray-700 text-lg">{event.description}</p>
                )}
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${eventStatus.class} whitespace-nowrap`}>
                {eventStatus.text}
              </div>
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

              {/* Spots Available */}
              <div className="flex items-center text-sm text-gray-700">
                <Users className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <span className="font-semibold">Spots Available: </span>
                  <span>
                    {userProfile?.gender === 'male' 
                      ? `${Math.max(0, event.maleCapacity - maleRegistrationCount)} / ${event.maleCapacity} (Male)`
                      : `${Math.max(0, event.femaleCapacity - femaleRegistrationCount)} / ${event.femaleCapacity} (Female)`
                    }
                  </span>
                </div>
              </div>


              {/* Your Status */}
              <div className="flex items-center text-sm text-gray-700">
                <CheckCircle className={`w-5 h-5 mr-3 ${isRegistered ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <span className="font-semibold">Your Status: </span>
                  <span className={isRegistered ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                    {isRegistered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Actions */}
          <div className="flex justify-center gap-4">
            {isRegistered ? (
              <>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleCancelRegistration}
                  disabled={registering || isPastEvent}
                  loading={registering}
                >
                  Cancel Registration
                </Button>
                {showCheckInButton && (
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleCheckIn}
                    disabled={!canCheckIn || checkingIn}
                    loading={checkingIn}
                    glow={canCheckIn}
                  >
                    Check In
                  </Button>
                )}
              </>
            ) : !isPastEvent && !isCancelled ? (
              <Button
                variant="primary"
                size="lg"
                onClick={canRegister ? handleRegister : undefined}
                disabled={!canRegister || registering}
                loading={registering}
                glow={canRegister ? canRegister : false}
              >
                Register for Event
              </Button>
            ) : null}
          </div>

          {/* Status Messages */}
          {!canRegister && !isRegistered && (
            <div className="text-center">
              {isPastEvent && <p className="text-gray-600">This event has already taken place.</p>}
              {isCancelled && <p className="text-red-600">This event has been cancelled.</p>}
              {isRegistrationClosed && !isPastEvent && !isCancelled && (
                <p className="text-orange-600">Registration is closed as the event has started.</p>
              )}
              {isFull && !isRegistrationClosed && !isPastEvent && !isCancelled && (
                <p className="text-orange-600">This event is currently full.</p>
              )}
              {!meetsAgeRequirement && !isPastEvent && !isCancelled && !isRegistrationClosed && !isFull && (
                <p className="text-orange-600">
                  You must be {event.ageRangeMax ? `between ${event.ageRangeMin} and ${event.ageRangeMax}` : `${event.ageRangeMin} or older`} years old to register for this event.
                </p>
              )}
            </div>
          )}

          {/* Event Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-navy text-left">Event Information</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="font-semibold text-navy mb-3 text-xl">What to Expect</h3>
              <p className="text-gray-700 leading-relaxed">Join us for an exciting speed dating event where you'll have the opportunity to meet other singles in a fun, structured environment. Each mini-date lasts just a few minutes, giving you the perfect amount of time to make a great first impression!</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="font-semibold text-navy mb-3 text-xl">How It Works</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>Check in at the event and receive your dating card</li>
                <li>Participate in quick 3-5 minute dates with other attendees</li>
                <li>Mark your dating card with who you'd like to see again</li>
                <li>We'll notify you of mutual matches within 24 hours</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="font-semibold text-navy mb-3 text-xl">Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>Please arrive 10 minutes before the start time</li>
                <li>Age range for this event: {event.ageRangeMin}{event.ageRangeMax ? ` - ${event.ageRangeMax}` : '+'} years</li>
                <li>Registration closes when the event starts</li>
                <li>Limited to {event.maleCapacity} males and {event.femaleCapacity} females</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}