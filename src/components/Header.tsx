import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

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
    <header className="bg-white border-b-4 border-navy p-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <button 
          onClick={handleHomeClick}
          className="text-3xl font-bold text-navy hover:text-orange transition-colors"
        >
          The Bus Stop
        </button>

        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={() => navigate(backButtonPath)}
              className="text-gray-600 hover:text-navy underline-animation"
            >
              {backButtonText}
            </button>
          )}
          
          {!loading && (
            <div>
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors font-semibold"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="bg-teal text-white px-6 py-2 rounded hover:bg-navy transition-colors font-semibold"
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