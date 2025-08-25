
import { useEffect, useState, type FormEvent } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Event from "../components/Event";
import type { SpeedDatingEvent } from "../types/event";

export default function AdminDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState<SpeedDatingEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<SpeedDatingEvent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [ageRangeMin, setAgeRangeMin] = useState("");
  const [ageRangeMax, setAgeRangeMax] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SpeedDatingEvent[];
        
        // Separate upcoming and past events
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        const upcoming = eventsData.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now || event.date >= today;
        });
        
        const past = eventsData.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate < now && event.date < today;
        });
        
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Validate form data
      const maxParticipantsNum = parseInt(maxParticipants);
      const ageRangeMinNum = parseInt(ageRangeMin);
      const ageRangeMaxNum = parseInt(ageRangeMax);

      if (isNaN(maxParticipantsNum) || maxParticipantsNum < 4) {
        setError("Maximum participants must be at least 4");
        setLoading(false);
        return;
      }

      if (isNaN(ageRangeMinNum) || isNaN(ageRangeMaxNum) || ageRangeMinNum >= ageRangeMaxNum) {
        setError("Please enter valid age range");
        setLoading(false);
        return;
      }

      if (startTime >= endTime) {
        setError("End time must be after start time");
        setLoading(false);
        return;
      }

      // Create event object
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        maxParticipants: maxParticipantsNum,
        ageRangeMin: ageRangeMinNum,
        ageRangeMax: ageRangeMaxNum,
        registrationDeadline,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        status: 'upcoming' as const
      };

      // Save to Firestore
      await addDoc(collection(db, "events"), eventData);

      // Reset form
      setTitle("");
      setDescription("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setMaxParticipants("");
      setAgeRangeMin("");
      setAgeRangeMax("");
      setRegistrationDeadline("");
      setShowCreateForm(false);

      // Refresh events list
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SpeedDatingEvent[];
      
      // Re-separate upcoming and past events
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const upcoming = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now || event.date >= today;
      });
      
      const past = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now && event.date < today;
      });
      
      setUpcomingEvents(upcoming);
      setPastEvents(past);

    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          {/* Upcoming Events & Create Event Section */}
          <div className="bg-white border-4 border-teal p-8 rounded-lg shadow-lg mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-navy">Upcoming Events</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-orange text-white px-6 py-2 rounded hover:bg-navy transition-colors font-semibold"
              >
                {showCreateForm ? 'Cancel' : 'Create New Event'}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-cream p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-navy mb-4">Create New Event</h3>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        Event Title *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="text"
                        placeholder="e.g., Singles Night at The Bus Stop"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                      Description (optional)
                    </label>
                    <textarea
                      className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none resize-none"
                      rows={3}
                      placeholder="Brief description of the event..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        Event Date *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        Start Time *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        End Time *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        Max Participants *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="number"
                        placeholder="20"
                        min="4"
                        max="100"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        Min Age *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="number"
                        placeholder="18"
                        min="18"
                        max="99"
                        value={ageRangeMin}
                        onChange={(e) => setAgeRangeMin(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                        Max Age *
                      </label>
                      <input
                        className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                        type="number"
                        placeholder="35"
                        min="18"
                        max="100"
                        value={ageRangeMax}
                        onChange={(e) => setAgeRangeMax(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                      Registration Deadline *
                    </label>
                    <input
                      className="w-full p-3 border-2 border-gray-300 rounded bg-white focus:border-orange focus:outline-none"
                      type="date"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 p-3 rounded-lg font-semibold transition-colors ${
                        loading 
                          ? "bg-gray-400 text-white cursor-not-allowed" 
                          : "bg-orange text-white hover:bg-navy"
                      }`}
                    >
                      {loading ? "Creating..." : "Create Event"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Upcoming Events List */}
            {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Event key={event.id} event={event} variant="upcoming" />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-600 py-4">
                  <p>No upcoming events.</p>
                </div>
              )}
          </div>

          {/* Past Events Section */}
          <div className="bg-white border-4 border-gray-400 p-8 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-navy mb-6">Past Events</h2>
              {pastEvents.length > 0 ? (
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <Event key={event.id} event={event} variant="past" />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-600 py-4">
                  <p>No past events.</p>
                </div>
              )}
          </div>


        </div>
      </main>

      <Footer />
    </div>
  );
}