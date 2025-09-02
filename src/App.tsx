import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import { EventProvider } from "./contexts/EventContext";
import AdminMatching from "./pages/AdminMatching";


function AppRoutes() {
  const { currentUser, isAdmin } = useAuth();
  const isAuthenticated = !!currentUser;

  const ProtectedRoute: React.FC<{children?: React.ReactNode}> = ({children}) => {
    if (!isAuthenticated) {
      return <Navigate to='/auth' replace />
    }
    return children ? children : <Outlet />
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? (isAdmin ? <AdminDashboard /> : <UserDashboard />) : <LandingPage />} 
      />
      <Route path="/auth" element={<UserAuth />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/event/:eventId" element={isAdmin ? <AdminEvent /> : <EventDetails />} />
        <Route path="/event/:eventId/matching" element={isAdmin ? <AdminMatching /> : <MatchingPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </EventProvider>
    </AuthProvider>
  );
}

export default App;
