import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { getCurrentUserProfile } from '../firebase/auth';
import type { User } from '../types';
import Loading from '../components/Loading';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  isAdmin: boolean;
  isProfileComplete: boolean;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (currentUser) {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setUserProfile(profile);
        setIsAdmin(profile.isAdmin || false);
        setIsProfileComplete(!!(profile.name && profile.gender && profile.interestedIn && profile.birthday));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile
        const profile = await getCurrentUserProfile();
        if (profile) {
          setUserProfile(profile);
          setIsAdmin(profile.isAdmin || false);
          setIsProfileComplete(!!(profile.name && profile.gender && profile.interestedIn && profile.birthday));
        } else {
          setUserProfile(null);
          setIsAdmin(false);
          setIsProfileComplete(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setIsProfileComplete(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <Loading fullPage={true} text="Loading..." />;
  }

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    isProfileComplete,
    loading,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}