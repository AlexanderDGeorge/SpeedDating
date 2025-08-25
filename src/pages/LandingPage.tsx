import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-8">
        {!showLoginForm ? (
          <div className="text-center max-w-4xl">
            <div className="bg-white border-4 border-navy p-12 rounded-lg shadow-lg">
              <h2 className="text-4xl font-bold text-navy mb-6">
                Welcome to The Bus Stop
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Find your perfect match at our exciting speed dating events! 
                Connect with new people in a fun, fast-paced environment.
              </p>
              
              {/* Two main options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {/* User Section */}
                <div className="bg-cream p-8 rounded-lg border-2 border-gold">
                  <h3 className="text-2xl font-bold text-navy mb-4">Join an Event</h3>
                  <p className="text-gray-700 mb-6">
                    Sign up to participate in upcoming speed dating events and meet amazing people!
                  </p>
                  <button
                    onClick={() => navigate("/auth")}
                    className="bg-teal text-white px-6 py-3 rounded-lg hover:bg-navy transition-colors font-semibold w-full"
                  >
                    Sign Up / Login
                  </button>
                </div>

                {/* Admin Section */}
                <div className="bg-cream p-8 rounded-lg border-2 border-gold">
                  <h3 className="text-2xl font-bold text-navy mb-4">Event Organizer</h3>
                  <p className="text-gray-700 mb-6">
                    Manage events, track participants, and view analytics for your speed dating events.
                  </p>
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="bg-orange text-white px-6 py-3 rounded-lg hover:bg-navy transition-colors font-semibold w-full"
                  >
                    Admin Login
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="bg-gold p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">👥</span>
                  </div>
                  <h3 className="font-bold text-navy">Meet New People</h3>
                  <p className="text-gray-600 text-sm mt-2">Connect with singles in your area</p>
                </div>
                <div className="text-center">
                  <div className="bg-teal p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">💕</span>
                  </div>
                  <h3 className="font-bold text-navy">Find Matches</h3>
                  <p className="text-gray-600 text-sm mt-2">Discover mutual connections</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">🎉</span>
                  </div>
                  <h3 className="font-bold text-navy">Fun Events</h3>
                  <p className="text-gray-600 text-sm mt-2">Enjoy organized social experiences</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <form onSubmit={handleLogin} className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-navy mb-6">Admin Sign In</h2>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <input
                className="w-full p-3 my-2 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="w-full p-3 my-2 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="submit"
                className="bg-orange text-white w-full p-3 rounded-lg hover:bg-navy transition-colors mt-4 font-semibold"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginForm(false);
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="text-gray-600 hover:text-navy w-full mt-4 underline-animation"
              >
                Back to Home
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}