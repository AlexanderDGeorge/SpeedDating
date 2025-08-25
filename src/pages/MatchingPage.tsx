import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Partner {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio?: string;
}

type RatingType = 'not-interested' | 'maybe' | 'interested' | null;

export default function MatchingPage() {
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  const [rating, setRating] = useState<RatingType>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [partnersQueue, setPartnersQueue] = useState<Partner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const navigate = useNavigate();

  // Mock partner data - in real app this would come from Firestore
  const mockPartners: Partner[] = [
    { id: "partner1", name: "Alex Johnson", age: 28, gender: "female", bio: "Love hiking and trying new restaurants. Looking for someone who shares my passion for adventure!" },
    { id: "partner2", name: "Sam Wilson", age: 32, gender: "male", bio: "Software engineer by day, musician by night. Always up for deep conversations about life and technology." },
    { id: "partner3", name: "Casey Martinez", age: 26, gender: "non-binary", bio: "Artist and coffee enthusiast. I believe in living life authentically and spreading positivity." },
    { id: "partner4", name: "Jordan Lee", age: 30, gender: "female", bio: "Travel blogger who's visited 35 countries. Seeking someone who loves exploring new cultures as much as I do." },
    { id: "partner5", name: "Taylor Brown", age: 29, gender: "male", bio: "Fitness trainer and dog lover. When I'm not at the gym, you'll find me at the park with my golden retriever." }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.uid);
      // Initialize partners queue with mock data
      setPartnersQueue(mockPartners);
      setCurrentPartner(mockPartners[0]);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmitRating = async () => {
    if (!rating || !currentPartner || !currentUserId) {
      alert("Please select a rating before continuing");
      return;
    }

    setLoading(true);

    try {
      // Save rating to Firestore
      await setDoc(doc(db, "ratings", `${currentUserId}_${currentPartner.id}`), {
        userId: currentUserId,
        partnerId: currentPartner.id,
        partnerName: currentPartner.name,
        rating: rating,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        sessionDate: new Date().toDateString()
      });

      // Move to next partner
      const nextIndex = currentIndex + 1;
      if (nextIndex < partnersQueue.length) {
        setCurrentIndex(nextIndex);
        setCurrentPartner(partnersQueue[nextIndex]);
        setRating(null);
        setNotes("");
      } else {
        // Session complete
        setSessionComplete(true);
      }
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("Error saving rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />

        <main className="flex-grow flex items-center justify-center p-8">
          <div className="bg-white border-4 border-navy p-12 rounded-lg shadow-lg text-center max-w-md">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-navy mb-4">Session Complete!</h2>
            <p className="text-gray-700 mb-8">
              Thank you for participating in tonight's speed dating event. 
              We'll notify you of any matches soon!
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-orange text-white px-8 py-3 rounded-lg hover:bg-navy transition-colors font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Progress Indicator */}
      <div className="bg-white border-b-2 border-navy p-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-navy font-semibold">
            Partner {currentIndex + 1} of {partnersQueue.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {currentPartner && (
            <div className="bg-white border-4 border-navy p-8 rounded-lg shadow-lg">
              {/* Partner Info */}
              <div className="text-center mb-8">
                <div className="bg-teal p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {currentPartner.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-navy mb-2">{currentPartner.name}</h2>
                <div className="flex justify-center gap-6 text-gray-700 mb-4">
                  <div className="bg-cream px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-600">Age</span>
                    <p className="font-semibold">{currentPartner.age}</p>
                  </div>
                  <div className="bg-cream px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-600">Gender</span>
                    <p className="font-semibold capitalize">{currentPartner.gender}</p>
                  </div>
                </div>
                {currentPartner.bio && (
                  <div className="bg-cream p-4 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-gray-600 mb-1">About Me</p>
                    <p className="text-navy italic">"{currentPartner.bio}"</p>
                  </div>
                )}
              </div>

              {/* Rating Options */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-navy mb-4 text-center">How interested are you?</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setRating('not-interested')}
                    className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                      rating === 'not-interested' 
                        ? 'bg-red-500 border-red-600 text-white' 
                        : 'bg-white border-red-300 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">😐</div>
                    Not Interested
                  </button>
                  <button
                    onClick={() => setRating('maybe')}
                    className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                      rating === 'maybe' 
                        ? 'bg-yellow-500 border-yellow-600 text-white' 
                        : 'bg-white border-yellow-300 text-yellow-600 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">🤔</div>
                    Maybe
                  </button>
                  <button
                    onClick={() => setRating('interested')}
                    className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                      rating === 'interested' 
                        ? 'bg-green-500 border-green-600 text-white' 
                        : 'bg-white border-green-300 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">😊</div>
                    Interested
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full p-3 border-2 border-gray-300 rounded bg-cream focus:border-orange focus:outline-none resize-none"
                  rows={3}
                  placeholder="Any additional thoughts or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {notes.length}/500 characters
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmitRating}
                  disabled={loading || !rating}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                    loading || !rating
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-orange text-white hover:bg-navy"
                  }`}
                >
                  {loading ? "Saving..." : 
                   currentIndex === partnersQueue.length - 1 ? "Finish Session" : "Next Partner"}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / partnersQueue.length) * 100}%` }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Progress: {currentIndex + 1} / {partnersQueue.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}