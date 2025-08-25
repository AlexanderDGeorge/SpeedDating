import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";
import type { User } from "../types";

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SpeedDatingEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || !userDoc.data().isAdmin) {
        navigate("/");
        return;
      }

      await fetchEventData();
    });

    return () => unsubscribe();
  }, [eventId, navigate]);

  const fetchEventData = async () => {
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

      // Fetch all users (potential registrants)
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => !user.isAdmin) as User[];
      setAllUsers(usersData);

      // For now, we'll create mock registrations since we haven't implemented the registration system yet
      // In a real app, you'd fetch from an "event_registrations" collection
      const mockRegistrations: EventRegistration[] = usersData
        .filter(() => Math.random() > 0.6) // Randomly select ~40% of users as registered
        .map((user, index) => ({
          id: `reg_${user.id}_${eventId}`,
          eventId: eventId,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userAge: user.age,
          userGender: user.gender,
          userBio: user.bio,
          registeredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last week
          status: index % 4 === 0 ? 'no-show' : index % 10 === 0 ? 'cancelled' : 'checked-in',
          notes: index % 5 === 0 ? 'VIP guest' : undefined
        }));

      setRegistrations(mockRegistrations);
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

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header 
        showBackButton={true}
        backButtonText="Back to Admin Dashboard"
        backButtonPath="/admin"
      />

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          {/* Event Info */}
          <div className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-navy mb-2">{event.title}</h1>
                <p className="text-gray-700 text-lg">{event.description}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                isPastEvent ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
              }`}>
                {isPastEvent ? 'Completed' : 'Upcoming'}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Date</p>
                <p className="font-semibold text-navy">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Time</p>
                <p className="font-semibold text-navy">{event.startTime} - {event.endTime}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Capacity</p>
                <p className="font-semibold text-navy">{registrations.length} / {event.maxParticipants}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Age Range</p>
                <p className="font-semibold text-navy">{event.ageRangeMin} - {event.ageRangeMax}</p>
              </div>
              <div className="bg-cream p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Registration Deadline</p>
                <p className="font-semibold text-navy">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
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
                      <th className="p-3 border text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr key={registration.id} className="bg-cream hover:bg-white transition-colors">
                        <td className="p-3 border">
                          <div>
                            <p className="font-semibold text-navy">{registration.userName}</p>
                            {registration.userBio && (
                              <p className="text-xs text-gray-600 italic mt-1 truncate max-w-xs" title={registration.userBio}>
                                "{registration.userBio}"
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 border text-sm">{registration.userEmail}</td>
                        <td className="p-3 border text-center">{registration.userAge}</td>
                        <td className="p-3 border capitalize">{registration.userGender}</td>
                        <td className="p-3 border">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(registration.status)}`}>
                            {getStatusText(registration.status)}
                          </span>
                        </td>
                        <td className="p-3 border text-sm">
                          {new Date(registration.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 border text-sm">
                          {registration.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">
                <p>No registrations for this event yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}