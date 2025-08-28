// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import getAuth for authentication
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// console.log(import.meta.env.VITE_API_KEY)
const firebaseConfig = {
  apiKey: "AIzaSyBs-cT_o13V4-j9rF82m7Utg94kiMGUz9s",
  authDomain: "speeddating-934e6.firebaseapp.com",
  projectId: "speeddating-934e6",
  storageBucket: "speeddating-934e6.firebasestorage.app",
  messagingSenderId: "726771715171",
  appId: "1:726771715171:web:6126e50a252079d1bbfc56",
  measurementId: "G-FJKML15LMW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app); // Ensure you import getAuth from 'firebase/auth' if you use auth