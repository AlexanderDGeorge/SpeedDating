import Header from "../components/Header";
import Footer from "../components/Footer";
import Event from "../components/Event";
import Loading from "../components/Loading";
import { useAuth } from "../contexts/AuthContext";
import { useEvents } from "../contexts/EventContext";


export default function UserDashboard() {
  const { userProfile } = useAuth();
  const { upcomingEvents, loading, error } = useEvents();

  if (loading) {
    return <Loading fullPage={true} text="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Text */}
          <h2 className="text-2xl font-bold text-navy text-center animate-fade-in">Welcome, {userProfile?.name || 'Guest'}!</h2>

          {/* Upcoming Events Section */}
          <h3 className="text-2xl text-left font-bold text-navy mb-6">Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => (
                <Event 
                  key={event.id} 
                  event={event} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-4 border-teal p-6 rounded-lg text-center">
              <p className="text-gray-600">No upcoming events scheduled yet.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new speed dating events!</p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}