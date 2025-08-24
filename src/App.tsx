import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { useState } from "react";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin onLogin={() => setLoggedIn(true)} />} />
        {loggedIn && <Route path="/dashboard" element={<AdminDashboard />} />}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
