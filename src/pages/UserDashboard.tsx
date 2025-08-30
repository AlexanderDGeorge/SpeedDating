import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Event from "../components/Event";
import Loading from "../components/Loading";
import type { SpeedDatingEvent } from "../types/event";

interface UserProfile {
  name: string;
  email: string;
  gender: string;
  birthday: string;
  bio?: string;
  createdAt: string;
}

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<SpeedDatingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/auth");
          return;
        }

        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }

        // Fetch upcoming events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventsData = eventsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as SpeedDatingEvent[];
        
        // Filter for upcoming events
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to beginning of today for accurate comparison
        const upcoming = eventsData.filter(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0); // Normalize to beginning of day
          return eventDate >= now;
        });
        
        setUpcomingEvents(upcoming);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return <Loading fullPage={true} text="Loading your dashboard..." />;
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