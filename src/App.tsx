import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserAuth from "./pages/UserAuth";
import UserDashboard from "./pages/UserDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import MatchingPage from "./pages/MatchingPage";
import EditProfile from "./pages/EditProfile";
import EventPage from "./pages/EventPage";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().isAdmin || false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? (isAdmin ? <Navigate to="/admin" /> : <UserDashboard />) 
              : <LandingPage />
          } 
        />
        <Route path="/auth" element={<UserAuth />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route 
          path="/admin" 
          element={isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/matching" 
          element={isAuthenticated && !isAdmin ? <MatchingPage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/edit-profile" 
          element={isAuthenticated && !isAdmin ? <EditProfile /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/event/:eventId" 
          element={isAuthenticated && isAdmin ? <EventPage /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
