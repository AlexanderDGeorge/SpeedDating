import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import logo from "../assets/TheBusStopLogo.avif";

interface HeaderProps {
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonPath?: string;
}

export default function Header({ showBackButton = false, backButtonText = "Back", backButtonPath = "/" }: HeaderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().isAdmin || false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
    <header className="bg-cream border-b-4 border-navy p-4 sm:p-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <button 
          onClick={handleHomeClick}
          className="hover:opacity-80 transition-opacity"
        >
          <img 
            src={logo} 
            alt="The Bus Stop" 
            className="h-10 sm:h-12 w-auto"
          />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          {showBackButton && (
            <button
              onClick={() => navigate(backButtonPath)}
              className="text-gray-600 hover:text-navy underline-animation text-sm sm:text-base"
            >
              <span className="hidden sm:inline">{backButtonText}</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          
          {!loading && (
            <div>
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-3 py-2 sm:px-6 rounded hover:bg-red-600 transition-colors font-semibold text-sm sm:text-base"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="bg-teal text-white px-3 py-2 sm:px-6 rounded hover:bg-navy transition-colors font-semibold text-sm sm:text-base"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}