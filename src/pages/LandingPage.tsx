import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { handleEmailAuth, handleGoogleAuth } from "../firebase/auth";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await handleEmailAuth(email, password, false); // false for sign in
      if (result.isAdmin) {
        navigate("/");
      } else {
        setError("Admin access required");
      }
    } catch (err: any) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await handleGoogleAuth();
      if (result.isAdmin) {
        navigate("/");
      } else {
        setError("Admin access required. Please contact support if you need admin access.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
                disabled={loading}
                className={`w-full p-3 rounded-lg transition-colors mt-4 font-semibold ${
                  loading 
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : "bg-orange text-white hover:bg-navy"
                }`}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
              
              <div className="flex items-center my-4">
                <hr className="flex-grow border-gray-300" />
                <span className="px-4 text-gray-500 text-sm">or</span>
                <hr className="flex-grow border-gray-300" />
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className={`w-full p-3 rounded-lg border-2 border-gray-300 font-semibold transition-colors ${
                  loading 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:border-orange"
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? "Signing In..." : "Sign In with Google"}
                </div>
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