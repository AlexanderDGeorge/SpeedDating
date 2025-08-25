import { useState, useEffect, type FormEvent } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
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

export default function EditProfile() {
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        // Fetch current user profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          navigate("/complete-profile");
          return;
        }

        const userData = userDoc.data() as UserProfile;
        setName(userData.name);
        setEmail(userData.email);
        setGender(userData.gender);
        setAge(userData.age.toString());
        setBio(userData.bio || "");
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load profile data");
      } finally {
        setInitialLoading(false);
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

      // Update user profile in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        gender: gender,
        age: ageNum,
        bio: bio.trim(),
        updatedAt: new Date().toISOString()
      });

      // Navigate back to dashboard
      navigate("/");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header 
        showBackButton={true}
        backButtonText="Back to Dashboard"
        backButtonPath="/"
      />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-navy mb-2">
              Edit Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Update your profile information
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Read-only fields */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Name
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                  type="text"
                  value={name}
                  disabled
                />
                <p className="text-gray-500 text-xs mt-1">Name cannot be changed</p>
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
                <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
              </div>

              {/* Editable fields */}
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
                <p className="text-gray-500 text-xs mt-1">Must be 18 or older</p>
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

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 p-3 rounded-lg font-semibold transition-colors ${
                  loading 
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : "bg-orange text-white hover:bg-navy"
                }`}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}