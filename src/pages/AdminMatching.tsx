import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Loading from "../components/Loading";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import { Users, RotateCw, ArrowRight, Timer, Heart } from "lucide-react";
import type { SpeedDatingEvent } from "../types/event";
import type { EventRegistration } from "../types/registration";
import type { User } from "../types";
import type { Rating } from "../types/rating";
import { fetchEventById } from "../firebase/event";
import { fetchEventRegistrations } from "../firebase/registration";
import { fetchAllUsers } from "../firebase/user";
import { getEventRatings } from "../firebase/rating";

interface PartnerPair {
  user1: User;
  user2: User;
  roundNumber: number;
  startTime: Date;
}

export default function AdminMatching() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SpeedDatingEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [checkedInUsers, setCheckedInUsers] = useState<User[]>([]);
  const [currentPairs, setCurrentPairs] = useState<PartnerPair[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundStartTime, setRoundStartTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rotating, setRotating] = useState(false);
  const [completedRatings, setCompletedRatings] = useState<Rating[]>([]);
  const [roundDuration] = useState(5); // 5 minutes per round

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  useEffect(() => {
    // Set up interval to refresh ratings every 30 seconds
    const interval = setInterval(() => {
      if (eventId) {
        fetchRatings();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) {
      setError("Event ID not found");
      setLoading(false);
      return;
    }

    try {
      // Fetch event details
      const eventData = await fetchEventById(eventId);
      if (!eventData) {
        setError("Event not found");
        setLoading(false);
        return;
      }

      if (eventData.status !== 'active') {
        setError("Event is not active. Please start the event first.");
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch registrations
      const registrationsData = await fetchEventRegistrations(eventId);
      const checkedInRegistrations = registrationsData.filter(r => r.status === 'checked-in');
      setRegistrations(checkedInRegistrations);

      // Fetch user data for checked-in users
      const allUsersData = await fetchAllUsers();
      const checkedInUserData = allUsersData.filter(user => 
        checkedInRegistrations.some(reg => reg.userId === user.id)
      );
      setCheckedInUsers(checkedInUserData);

      // Initialize pairs if not already set
      if (checkedInUserData.length > 0 && currentPairs.length === 0) {
        initializePairs(checkedInUserData);
      }

      // Fetch completed ratings
      await fetchRatings();
    } catch (err) {
      console.error("Error fetching event data:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    if (!eventId) return;
    try {
      const ratings = await getEventRatings(eventId);
      setCompletedRatings(ratings);
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

  const initializePairs = (users: User[]) => {
    // Separate users by gender for heterosexual matching
    const maleUsers = users.filter(u => u.gender === 'male');
    const femaleUsers = users.filter(u => u.gender === 'female');
    
    // For other gender combinations, we'll need more complex logic
    const pairs: PartnerPair[] = [];
    const maxPairs = Math.min(maleUsers.length, femaleUsers.length);
    
    for (let i = 0; i < maxPairs; i++) {
      pairs.push({
        user1: maleUsers[i],
        user2: femaleUsers[i],
        roundNumber: 1,
        startTime: new Date()
      });
    }
    
    setCurrentPairs(pairs);
    setRoundStartTime(new Date());
  };

  const rotatePartners = () => {
    if (currentPairs.length === 0) return;
    
    setRotating(true);
    
    // Simple rotation algorithm: keep one group stationary, rotate the other
    const maleUsers = checkedInUsers.filter(u => u.gender === 'male');
    const femaleUsers = checkedInUsers.filter(u => u.gender === 'female');
    
    // Rotate female users (or could rotate male users instead)
    const rotatedFemales = [...femaleUsers];
    if (rotatedFemales.length > 1) {
      const last = rotatedFemales.pop();
      if (last) rotatedFemales.unshift(last);
    }
    
    const newPairs: PartnerPair[] = [];
    const maxPairs = Math.min(maleUsers.length, rotatedFemales.length);
    
    for (let i = 0; i < maxPairs; i++) {
      newPairs.push({
        user1: maleUsers[i],
        user2: rotatedFemales[i],
        roundNumber: currentRound + 1,
        startTime: new Date()
      });
    }
    
    setCurrentPairs(newPairs);
    setCurrentRound(currentRound + 1);
    setRoundStartTime(new Date());
    
    setTimeout(() => setRotating(false), 1000);
  };

  const getRatingStatus = (userId1: string, userId2: string): 'both' | 'partial' | 'none' => {
    const user1Rated = completedRatings.some(r => r.userId === userId1 && r.partnerId === userId2);
    const user2Rated = completedRatings.some(r => r.userId === userId2 && r.partnerId === userId1);
    
    if (user1Rated && user2Rated) return 'both';
    if (user1Rated || user2Rated) return 'partial';
    return 'none';
  };

  const getTimeElapsed = (): string => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - roundStartTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Loading fullPage={true} text="Loading matching data..." />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || "Event not found"}</div>
          <Button 
            variant="primary"
            onClick={() => navigate(`/admin/event/${eventId}`)}
          >
            Back to Event Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
                  Match Management - {event.title}
                </h1>
                <p className="text-gray-600">
                  Manage partner rotations and monitor matching progress
                </p>
              </div>
              <StatusBadge status={event.status} variant="event" />
            </div>
          </div>

          {/* Round Info and Controls */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <RotateCw className="w-5 h-5 mr-2 text-navy" />
                  <span className="text-gray-600">Current Round</span>
                </div>
                <p className="text-3xl font-bold text-navy">{currentRound}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Timer className="w-5 h-5 mr-2 text-navy" />
                  <span className="text-gray-600">Time Elapsed</span>
                </div>
                <p className="text-3xl font-bold text-navy">{getTimeElapsed()}</p>
                <p className="text-sm text-gray-500 mt-1">({roundDuration} min rounds)</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 mr-2 text-navy" />
                  <span className="text-gray-600">Active Pairs</span>
                </div>
                <p className="text-3xl font-bold text-navy">{currentPairs.length}</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="primary"
                onClick={rotatePartners}
                loading={rotating}
                disabled={currentPairs.length === 0}
                className="flex items-center"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                {rotating ? "Rotating..." : "Rotate Partners"}
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => navigate(`/admin/event/${eventId}`)}
                className="flex items-center"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Event Admin
              </Button>
            </div>
          </div>

          {/* Current Pairs */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-navy mb-4">Current Partner Pairs</h2>
            
            {currentPairs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPairs.map((pair, index) => {
                  const ratingStatus = getRatingStatus(pair.user1.id, pair.user2.id);
                  
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-600">
                          Pair {index + 1}
                        </span>
                        <div className="flex items-center">
                          {ratingStatus === 'both' && (
                            <span className="text-green-600 text-xs flex items-center">
                              <Heart className="w-3 h-3 mr-1 fill-current" />
                              Both Rated
                            </span>
                          )}
                          {ratingStatus === 'partial' && (
                            <span className="text-yellow-600 text-xs flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              Partial
                            </span>
                          )}
                          {ratingStatus === 'none' && (
                            <span className="text-gray-400 text-xs flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              Not Rated
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="bg-teal rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            <span className="text-white font-bold">
                              {pair.user1.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-navy">{pair.user1.name}</p>
                            <p className="text-xs text-gray-600 capitalize">{pair.user1.gender}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-center">
                          <span className="text-gray-400">↔️</span>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-orange rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            <span className="text-white font-bold">
                              {pair.user2.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-navy">{pair.user2.name}</p>
                            <p className="text-xs text-gray-600 capitalize">{pair.user2.gender}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No active pairs. Make sure users are checked in.</p>
              </div>
            )}

            {/* Unmatched Users */}
            {checkedInUsers.length > currentPairs.length * 2 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Waiting for Partners
                </h3>
                <div className="flex flex-wrap gap-2">
                  {checkedInUsers
                    .filter(user => !currentPairs.some(p => p.user1.id === user.id || p.user2.id === user.id))
                    .map(user => (
                      <span
                        key={user.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {user.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}