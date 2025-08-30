import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserAuth from "./pages/UserAuth";
import UserDashboard from "./pages/UserDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import MatchingPage from "./pages/MatchingPage";
import EditProfile from "./pages/EditProfile";
import AdminEvent from "./pages/AdminEvent";
import EventDetails from "./pages/EventDetails";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppRoutes() {
  const { currentUser, isAdmin } = useAuth();
  const isAuthenticated = !!currentUser;

  return (
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
        element={isAuthenticated && isAdmin ? <AdminEvent /> : <Navigate to="/" />} 
      />
      <Route 
        path="/event/:eventId" 
        element={isAuthenticated ? <EventDetails /> : <Navigate to="/auth" />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
