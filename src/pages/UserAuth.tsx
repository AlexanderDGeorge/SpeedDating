import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function UserAuth() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Create user account
        await createUserWithEmailAndPassword(auth, email, password);
        // Redirect to profile completion
        navigate("/complete-profile");
      } else {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (!userDoc.exists()) {
          // If profile doesn't exist, user needs to complete registration
          navigate("/complete-profile");
        } else {
          const userData = userDoc.data();
          if (userData.isAdmin) {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use' && isSignUp) {
        // User tried to sign up with existing email, attempt to sign in instead
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // Check if user profile exists
          const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
          
          if (!userDoc.exists()) {
            navigate("/complete-profile");
          } else {
            const userData = userDoc.data();
            if (userData.isAdmin) {
              navigate("/admin");
            } else {
              navigate("/");
            }
          }
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/wrong-password') {
            setError("Account exists with this email but password is incorrect. Please use the correct password or reset it.");
            setIsSignUp(false);
          } else {
            setError("Account exists with this email. Please sign in instead.");
            setIsSignUp(false);
          }
        }
      } else if (err.code === 'auth/user-not-found') {
        setError("No account found. Please sign up.");
        setIsSignUp(true);
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // New Google user needs to complete profile
        navigate("/complete-profile");
      } else {
        // Existing user, check if admin
        const userData = userDoc.data();
        if (userData.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header 
        showBackButton={true}
        backButtonText="Back to Home"
        backButtonPath="/"
      />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-navy mb-2">
                {isSignUp ? "Join The Bus Stop" : "Welcome Back to The Bus Stop"}
              </h2>
              <p className="text-gray-600 mb-6">
                {isSignUp ? "Create your account to join our speed dating events" : "Sign in to access your account"}
              </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Email
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Password
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-lg mt-6 font-semibold transition-colors ${
                loading 
                  ? "bg-gray-400 text-white cursor-not-allowed" 
                  : "bg-orange text-white hover:bg-navy"
              }`}
            >
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </button>

            {/* Google Sign In Button */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full p-3 rounded-lg mt-6 font-semibold transition-colors border-2 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? "Processing..." : "Continue with Google"}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-teal hover:text-navy underline-animation"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Need an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}