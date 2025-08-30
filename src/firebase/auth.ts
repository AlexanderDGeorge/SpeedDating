import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User as FirebaseUser
} from "firebase/auth";
import { auth } from "./index";
import { fetchUserById } from "./user";
import type { User } from "../types";

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();

export interface AuthResult {
  user: FirebaseUser;
  userProfile: User | null;
  needsProfileCompletion: boolean;
  isAdmin: boolean;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Fetch user profile
  const userProfile = await fetchUserById(user.uid);
  
  return {
    user,
    userProfile,
    needsProfileCompletion: !userProfile,
    isAdmin: userProfile?.isAdmin || false
  };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // New users always need profile completion
  return {
    user,
    userProfile: null,
    needsProfileCompletion: true,
    isAdmin: false
  };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Check if user profile exists
  const userProfile = await fetchUserById(user.uid);
  
  return {
    user,
    userProfile,
    needsProfileCompletion: !userProfile,
    isAdmin: userProfile?.isAdmin || false
  };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function handleEmailAuth(email: string, password: string, isSignUp: boolean): Promise<AuthResult> {
  try {
    if (isSignUp) {
      return await signUpWithEmail(email, password);
    } else {
      return await signInWithEmail(email, password);
    }
  } catch (error: any) {
    // Handle specific auth errors
    if (error.code === 'auth/email-already-in-use' && isSignUp) {
      // User tried to sign up with existing email, attempt to sign in instead
      try {
        return await signInWithEmail(email, password);
      } catch (signInError: any) {
        if (signInError.code === 'auth/wrong-password') {
          throw new Error("Account exists with this email but password is incorrect. Please use the correct password or reset it.");
        } else {
          throw new Error("Account exists with this email. Please sign in instead.");
        }
      }
    } else if (error.code === 'auth/user-not-found') {
      throw new Error("No account found. Please sign up.");
    } else if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password should be at least 6 characters");
    } else {
      throw new Error("An error occurred. Please try again.");
    }
  }
}

export async function handleGoogleAuth(): Promise<AuthResult> {
  try {
    return await signInWithGoogle();
  } catch (error: any) {
    throw new Error("Failed to sign in with Google. Please try again.");
  }
}

// Admin-specific sign in
export async function signInAsAdmin(email: string, password: string): Promise<AuthResult> {
  const result = await signInWithEmail(email, password);
  
  if (!result.isAdmin) {
    // Sign out the user if they're not an admin
    await signOut();
    throw new Error("Access denied. Admin credentials required.");
  }
  
  return result;
}

// Helper function to get current user profile
export async function getCurrentUserProfile(): Promise<User | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  
  return await fetchUserById(currentUser.uid);
}