import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface UserProfile {
  name: string;
  email: string;
  gender: string;
  age: number;
  bio?: string;
  createdAt: string;
}

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/auth");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-navy mb-6">Welcome, {userProfile?.name || 'Guest'}!</h2>
            {userProfile && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-cream p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Name</p>
                    <p className="font-semibold text-navy">{userProfile.name}</p>
                  </div>
                  <div className="bg-cream p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Email</p>
                    <p className="font-semibold text-navy">{userProfile.email}</p>
                  </div>
                  <div className="bg-cream p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Gender</p>
                    <p className="font-semibold text-navy capitalize">{userProfile.gender}</p>
                  </div>
                  <div className="bg-cream p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Age</p>
                    <p className="font-semibold text-navy">{userProfile.age} years old</p>
                  </div>
                </div>
                
                {userProfile.bio && (
                  <div className="bg-cream p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">About Me</p>
                    <p className="text-navy">{userProfile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Events Section */}
          <div className="bg-white border-4 border-teal p-8 rounded-lg shadow-lg mb-8">
            <h3 className="text-xl font-bold text-navy mb-4">Upcoming Events</h3>
            <div className="bg-cream p-6 rounded-lg text-center">
              <p className="text-gray-600">No upcoming events scheduled yet.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new speed dating events!</p>
            </div>
          </div>

          {/* Matches Section */}
          <div className="bg-white border-4 border-gold p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-navy mb-4">Your Matches</h3>
            <div className="bg-cream p-6 rounded-lg text-center">
              <p className="text-gray-600">No matches yet.</p>
              <p className="text-gray-500 text-sm mt-2">Participate in events to find your matches!</p>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-teal text-white p-4 rounded-lg hover:bg-navy transition-colors font-semibold">
              Browse Events
            </button>
            <button 
              onClick={() => navigate("/matching")}
              className="bg-gold text-white p-4 rounded-lg hover:bg-navy transition-colors font-semibold"
            >
              Start Speed Dating
            </button>
            <button 
              onClick={() => navigate("/edit-profile")}
              className="bg-orange text-white p-4 rounded-lg hover:bg-navy transition-colors font-semibold"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}