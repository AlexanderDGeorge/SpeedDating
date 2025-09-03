import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { getMaxBirthdayDate, getMinBirthdayDate } from "../utils/dateUtils";
import { useAuth } from "../contexts/AuthContext";
import { createUser } from "../firebase/user";
import type { User } from "../types";

export default function CompleteProfile() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<User['gender']>();
  const [interestedIn, setInterestedIn] = useState<User['interestedIn']>();
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    // Check if profile already exists
    if (userProfile) {
      navigate("/");
      return;
    }

    // Set email from auth
    if (currentUser) {
      setEmail(currentUser.email || "");
      
      // If Google user, we might have their name
      if (currentUser.displayName) {
        setName(currentUser.displayName);
      }
    }
  }, [currentUser, userProfile, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!gender || !interestedIn || !currentUser) return;
    setLoading(true);

    try {
      // Validate birthday
      if (!birthday) {
        setError("Please enter your birthday");
        setLoading(false);
        return;
      }
      
      // Validate age from birthday (must be at least 18)
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        setError("You must be at least 18 years old to use this service");
        setLoading(false);
        return;
      }
      
      if (age > 100) {
        setError("Please enter a valid birthday");
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
      await createUser(currentUser.uid, {
        name: name.trim(),
        email: currentUser.email || '',
        gender: gender,
        interestedIn: interestedIn,
        birthday: birthday,
        bio: bio.trim(),
        createdAt: new Date().toISOString(),
        isAdmin: false,
        authProvider: currentUser.providerData[0]?.providerId || "email"
      });

      navigate("/");
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
                  Birthday *
                </label>
                <input
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  min={getMinBirthdayDate()}
                  max={getMaxBirthdayDate()}
                  required
                />
                <p className="text-gray-500 text-sm mt-1">Must be 18 or older to participate</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Gender *
                </label>
                <select
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as User['gender'])}
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
                  onChange={(e) => setInterestedIn(e.target.value as User['interestedIn'])}
                  required
                >
                  <option value="">Select Preference</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="other">Both</option>
                  <option value="other">Other</option>
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

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={loading || !name.trim() || !gender || !interestedIn || !birthday}
              loading={loading}
              className="mt-6"
            >
              Complete Profile
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}