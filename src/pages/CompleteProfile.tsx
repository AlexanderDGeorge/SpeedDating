import { useState, type FormEvent, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CompleteProfile() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if profile already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/");
        }
        return;
      }

      // Set email from auth
      setEmail(user.email || "");
      
      // If Google user, we might have their name
      if (user.displayName) {
        setName(user.displayName);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth");
        return;
      }

      // Validate age
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        setError("Please enter a valid age between 18 and 100");
        setLoading(false);
        return;
      }

      // Validate name
      if (name.trim().length < 2) {
        setError("Please enter your full name");
        setLoading(false);
        return;
      }

      // Save user profile to Firestore using auth UID as document ID
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: user.email,
        gender: gender,
        age: ageNum,
        bio: bio.trim(),
        createdAt: new Date().toISOString(),
        isAdmin: false,
        authProvider: user.providerData[0]?.providerId || "email"
      });

      navigate("/dashboard");
    } catch (err) {
      setError("Failed to complete profile. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-navy mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Just a few more details to join The Bus Stop events
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Name *
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Email
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                  type="email"
                  value={email}
                  disabled
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Gender *
                </label>
                <select
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Age *
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="number"
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
                <p className="text-gray-500 text-sm mt-1">Must be 18 or older to participate</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Bio (optional)
                </label>
                <textarea
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none resize-none"
                  rows={3}
                  placeholder="Tell us a little about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {bio.length}/300 characters
                </div>
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
              {loading ? "Creating Profile..." : "Complete Profile"}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={async () => {
                  await auth.signOut();
                  navigate("/auth");
                }}
                className="text-gray-600 hover:text-navy underline-animation"
              >
                Sign out and start over
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}