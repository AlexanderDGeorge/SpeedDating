import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Event from "../components/Event";
import CreateEventForm from "../components/CreateEventForm";
import type { SpeedDatingEvent } from "../types/event";
import { fetchAllEvents } from "../firebase/event";

export default function AdminDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState<SpeedDatingEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<SpeedDatingEvent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchEvents = async () => {
    try {
      const allEvents = await fetchAllEvents();
      const upcoming: SpeedDatingEvent[] = [];
      const past: SpeedDatingEvent[] = [];
      
      allEvents.forEach(event => {
        if (event.status === 'upcoming' || event.status === 'checking-in' || event.status === 'active') {
          upcoming.push(event);
        } else if (event.status === 'completed' || event.status === 'cancelled') {
          past.push(event);
        }
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
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Create Event Button */}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="align-left bg-orange text-white px-6 py-2 rounded hover:bg-navy transition-colors font-semibold"
            >
              {showCreateForm ? 'Cancel' : 'Create New Event'}
            </button>

          {showCreateForm && (
            <CreateEventForm 
              onEventCreated={handleEventCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Upcoming Events Section */}
          <h3 className="text-2xl text-left font-bold text-navy mb-6">Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => (
                <Event key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-700">No upcoming events.</p>
              <p className="text-gray-700 mt-2">Create your first event to get started!</p>
            </div>
          )}

          {/* Past Events Section */}
          <h3 className="text-2xl text-left font-bold text-navy mb-6">Past Events</h3>
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {pastEvents.map((event) => (
                <Event key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-gray-700">No past events yet.</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}