import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Check if user profile exists and is complete
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin || false);
            
            // Check if profile is complete (has required fields)
            const isProfileComplete = userData.name && 
                                     userData.gender && 
                                     userData.interestedIn && 
                                     userData.birthday;
            
            // If profile is incomplete and not already on complete-profile page, redirect
            if (!isProfileComplete && !window.location.pathname.includes('/complete-profile')) {
              navigate("/complete-profile");
            }
          } else {
            // If user document doesn't exist, redirect to complete profile
            if (!window.location.pathname.includes('/complete-profile')) {
              navigate("/complete-profile");
            }
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleHomeClick = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  return (
    <header className="bg-white border-b-4 border-navy p-4 sm:p-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <button 
          onClick={handleHomeClick}
          className="text-xl sm:text-[22px] font-light text-navy cursor-pointer font-futura"
          style={{ fontFamily: 'Futura, "Trebuchet MS", Arial, sans-serif' }}
        >
          THE BUS STOP
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          {!loading && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg 
                  className="w-6 h-6 text-navy" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 p-1 bg-white border-2 border-navy rounded-lg shadow-lg z-50">
                  {isAuthenticated ? (
                    <>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                        >
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => {
                          navigate("/");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          navigate("/edit-profile");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                      >
                        Edit Profile
                      </button>
                      <hr className="border-gray-200 my-1" />
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-cream transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          navigate("/auth");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => {
                          navigate("/auth");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}