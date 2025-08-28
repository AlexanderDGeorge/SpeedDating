import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { calculateAge } from "../utils/dateUtils";
import type { SpeedDatingEvent } from "../types/event";

interface EventRegistration {
  id?: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  status: 'registered' | 'cancelled';
}

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SpeedDatingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRegistrationId, setUserRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.uid);

      // Check if user is admin (admins should use the admin event page)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isAdmin) {
          navigate(`/admin/event/${eventId}`);
          return;
        }
        setUserProfile(userData);
      }

      await fetchEventData(user.uid);
    });

    return () => unsubscribe();
  }, [eventId, navigate]);

  const fetchEventData = async (userId: string) => {
    if (!eventId) {
      setError("Event ID not found");
      setLoading(false);
      return;
    }

    try {
      // Fetch event details
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (!eventDoc.exists()) {
        setError("Event not found");
        setLoading(false);
        return;
      }

      const eventData = { id: eventDoc.id, ...eventDoc.data() } as SpeedDatingEvent;
      setEvent(eventData);

      // Check if user is registered for this event
      const registrationsQuery = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        where("userId", "==", userId),
        where("status", "==", "registered")
      );
      const userRegistration = await getDocs(registrationsQuery);
      setIsRegistered(!userRegistration.empty);
      if (!userRegistration.empty) {
        setUserRegistrationId(userRegistration.docs[0].id);
      }

      // Get total registration count
      const allRegistrationsQuery = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        where("status", "==", "registered")
      );
      const allRegistrations = await getDocs(allRegistrationsQuery);
      setRegistrationCount(allRegistrations.size);

    } catch (err) {
      console.error("Error fetching event data:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event || !currentUserId || !userProfile) return;

    setRegistering(true);
    try {
      // Check if event is full
      if (registrationCount >= event.maxParticipants) {
        alert("Sorry, this event is full!");
        return;
      }

      // Check if registration deadline has passed
      if (new Date(event.registrationDeadline) < new Date()) {
        alert("Registration deadline has passed for this event.");
        return;
      }

      // Check age requirements
      const age = calculateAge(userProfile.birthday);
      if (age < event.ageRangeMin || age > event.ageRangeMax) {
        alert(`This event is for ages ${event.ageRangeMin}-${event.ageRangeMax}. You do not meet the age requirements.`);
        return;
      }

      // Create registration
      const registrationData: EventRegistration = {
        eventId: eventId!,
        userId: currentUserId,
        registeredAt: new Date().toISOString(),
        status: 'registered'
      };

      await addDoc(collection(db, "registrations"), registrationData);
      
      setIsRegistered(true);
      setRegistrationCount(prev => prev + 1);
      alert("Successfully registered for the event!");
      
    } catch (err) {
      console.error("Error registering for event:", err);
      alert("Failed to register for the event. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!eventId || !currentUserId) return;

    if (!confirm("Are you sure you want to cancel your registration?")) return;

    setRegistering(true);
    try {
      // Find and delete the user's registration
      const registrationsQuery = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        where("userId", "==", currentUserId),
        where("status", "==", "registered")
      );
      
      const userRegistration = await getDocs(registrationsQuery);
      
      if (!userRegistration.empty) {
        // Update registration status to cancelled instead of deleting
        const registrationDoc = userRegistration.docs[0];
        await deleteDoc(doc(db, "registrations", registrationDoc.id));
        
        setIsRegistered(false);
        setRegistrationCount(prev => prev - 1);
        alert("Your registration has been cancelled.");
      }
      
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
      await updateDoc(doc(db, "registrations", userRegistrationId), {
        status: 'checked-in'
      });
      
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

  const isPastEvent = new Date(event.date) < new Date();
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  const isRegistrationClosed = new Date(event.registrationDeadline) < new Date();
  const isFull = registrationCount >= event.maxParticipants;
  const userAge = userProfile ? calculateAge(userProfile.birthday) : 0;
  const meetsAgeRequirement = userProfile && userAge >= event.ageRangeMin && userAge <= event.ageRangeMax;
  const canRegister = !isPastEvent && !isCancelled && !isRegistrationClosed && !isFull && !isRegistered && meetsAgeRequirement;

  // Check if check-in button should be shown (for registered users)
  const showCheckInButton = isRegistered && !isPastEvent && !isCancelled && !isCompleted;
  
  // Check if check-in is enabled (15 minutes before event start)
  const canCheckIn = (() => {
    if (!showCheckInButton) return false;
    
    // Parse event date and start time
    const [year, month, day] = event.date.split('-').map(num => parseInt(num));
    const [hours, minutes] = event.startTime.split(':').map(num => parseInt(num));
    const eventDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Check if current time is within 15 minutes of event start
    const now = new Date();
    const timeDiff = eventDateTime.getTime() - now.getTime();
    const minutesUntilEvent = timeDiff / (1000 * 60);
    
    return minutesUntilEvent <= 15 && minutesUntilEvent > -60; // Available 15 min before to 60 min after start
  })();

  // Format time to 12-hour format
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour12 = parseInt(hours);
    const ampm = hour12 >= 12 ? 'PM' : 'AM';
    const displayHour = hour12 % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventStatus = () => {
    if (isCancelled) return { text: 'Cancelled', class: 'bg-red-200 text-red-700' };
    if (isPastEvent) return { text: 'Completed', class: 'bg-green-200 text-green-800' };
    if (isFull) return { text: 'Full', class: 'bg-orange-200 text-orange-800' };
    if (isRegistrationClosed) return { text: 'Registration Closed', class: 'bg-gray-200 text-gray-700' };
    return { text: 'Open for Registration', class: 'bg-teal-100 text-teal-700' };
  };

  const eventStatus = getEventStatus();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header 
        showBackButton={true}
        backButtonText="Back to Dashboard"
        backButtonPath="/"
      />

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Info */}
          <div className="bg-white border-4 border-navy p-6 sm:p-8 rounded-lg shadow-lg mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2 text-left">{event.title}</h1>
                {event.description && (
                  <p className="text-gray-700 text-lg text-left">{event.description}</p>
                )}
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${eventStatus.class} whitespace-nowrap`}>
                {eventStatus.text}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Date</p>
                <p className="font-semibold text-navy">{(() => {
                  // Parse the date string and add timezone offset to avoid day shifting
                  const [year, month, day] = event.date.split('-').map(num => parseInt(num));
                  const date = new Date(year, month - 1, day); // month is 0-indexed
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                })()}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Time</p>
                <p className="font-semibold text-navy">{formatTime(event.startTime)}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Spots Available</p>
                <p className="font-semibold text-navy">
                  {Math.max(0, event.maxParticipants - registrationCount)} / {event.maxParticipants}
                </p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Age Range</p>
                <p className="font-semibold text-navy">{event.ageRangeMin} - {event.ageRangeMax} years</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Registration Deadline</p>
                <p className="font-semibold text-navy">{(() => {
                  // Parse the date string and add timezone offset to avoid day shifting
                  const [year, month, day] = event.registrationDeadline.split('-').map(num => parseInt(num));
                  const date = new Date(year, month - 1, day); // month is 0-indexed
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                })()}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Your Status</p>
                <p className={`font-semibold ${isRegistered ? 'text-green-600' : 'text-gray-600'}`}>
                  {isRegistered ? '✓ Registered' : 'Not Registered'}
                </p>
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
                  glow={canRegister}
                >
                  Register for Event
                </Button>
              ) : null}
            </div>

            {/* Status Messages */}
            {!canRegister && !isRegistered && (
              <div className="mt-4 text-center">
                {isPastEvent && <p className="text-gray-600">This event has already taken place.</p>}
                {isCancelled && <p className="text-red-600">This event has been cancelled.</p>}
                {isRegistrationClosed && !isPastEvent && !isCancelled && (
                  <p className="text-orange-600">Registration deadline has passed.</p>
                )}
                {isFull && !isRegistrationClosed && !isPastEvent && !isCancelled && (
                  <p className="text-orange-600">This event is currently full.</p>
                )}
                {!meetsAgeRequirement && !isPastEvent && !isCancelled && !isRegistrationClosed && !isFull && (
                  <p className="text-orange-600">
                    You must be between {event.ageRangeMin} and {event.ageRangeMax} years old to register for this event.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Event Details Section */}
          <div className="bg-white border-4 border-teal p-6 sm:p-8 rounded-lg shadow-lg animate-slide-up">
            <h2 className="text-xl font-bold text-navy mb-4">Event Information</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-navy mb-2">What to Expect</h3>
                <p>Join us for an exciting speed dating event where you'll have the opportunity to meet {event.maxParticipants - 1} other singles in a fun, structured environment. Each mini-date lasts just a few minutes, giving you the perfect amount of time to make a great first impression!</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-navy mb-2">How It Works</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check in at the event and receive your dating card</li>
                  <li>Participate in quick 3-5 minute dates with other attendees</li>
                  <li>Mark your dating card with who you'd like to see again</li>
                  <li>We'll notify you of mutual matches within 24 hours</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-navy mb-2">Important Notes</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Please arrive 10 minutes before the start time</li>
                  <li>Age range for this event: {event.ageRangeMin} - {event.ageRangeMax} years</li>
                  <li>Registration closes on {(() => {
                    // Parse the date string and add timezone offset to avoid day shifting
                    const [year, month, day] = event.registrationDeadline.split('-').map(num => parseInt(num));
                    const date = new Date(year, month - 1, day); // month is 0-indexed
                    return date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  })()}</li>
                  <li>Limited to {event.maxParticipants} participants</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}