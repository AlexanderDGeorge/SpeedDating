import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { updateUser } from "../firebase/user";
import type { User } from "../types";


export default function EditProfile() {
  const [gender, setGender] = useState<User['gender']>();
  const [interestedIn, setInterestedIn] = useState<User['interestedIn']>();
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      navigate("/complete-profile");
      return;
    }

    // Set form values from user profile
    setName(userProfile.name);
    setEmail(userProfile.email);
    setGender(userProfile.gender);
    setInterestedIn(userProfile.interestedIn || "");
    setBirthday(userProfile.birthday || "");
    setBio(userProfile.bio || "");
    setInitialLoading(false);
  }, [userProfile, navigate]);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if(!currentUser || !gender || !interestedIn) return
    setLoading(true);

    try {
      // Validate name
      if (!name.trim() || name.trim().length < 2) {
        setError("Please enter your full name");
        setLoading(false);
        return;
      }

      // Validate email
      if (!email.trim() || !email.includes('@')) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Validate birthday
      if (!birthday) {
        setError("Please enter your birthday");
        setLoading(false);
        return;
      }

      // Validate interested in
      if (!interestedIn) {
        setError("Please select who you're interested in");
        setLoading(false);
        return;
      }

      // Update user profile in Firestore
      await updateUser(currentUser.uid, {
        name: name.trim(),
        email: email.trim(),
        gender: gender,
        interestedIn: interestedIn,
        birthday: birthday,
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
      <Header />

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
              {/* Editable fields */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Name *
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Email *
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Birthday *
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  required
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
                  Interested In *
                </label>
                <select
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  value={interestedIn}
                  onChange={(e) => setInterestedIn(e.target.value)}
                  required
                >
                  <option value="">Select Preference</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="other">Other</option>
                  <option value="prefer not to say">Prefer not to say</option>
                </select>
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