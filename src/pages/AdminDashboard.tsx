import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Event from "../components/Event";
import CreateEventForm from "../components/CreateEventForm";
import type { SpeedDatingEvent } from "../types/event";

export default function AdminDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState<SpeedDatingEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<SpeedDatingEvent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchEvents = async () => {
    try {
      // Fetch events
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const eventsData = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SpeedDatingEvent[];
      
      // Separate upcoming and past events
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to beginning of today for accurate comparison
      
      const upcoming = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0); // Normalize to beginning of day
        return eventDate >= now;
      });
      
      const past = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0); // Normalize to beginning of day
        return eventDate < now;
      });
      
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventCreated = () => {
    setShowCreateForm(false);
    fetchEvents(); // Refresh the events list
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
              <CreateEventForm 
                onEventCreated={handleEventCreated}
                onCancel={() => setShowCreateForm(false)}
              />
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
            <h2 className="text-2xl font-bold text-navy mb-6 text-left">Past Events</h2>
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