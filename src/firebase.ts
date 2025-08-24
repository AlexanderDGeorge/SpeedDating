// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import getAuth for authentication
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

console.log(import.meta.env.VITE_API_KEY)
const firebaseConfig = {
  apiKey: `${import.meta.env.VITE_API_KEY}`,
  authDomain: "bsspeed-dating-app.firebaseapp.com",
  projectId: "bsspeed-dating-app",
  storageBucket: "bsspeed-dating-app.firebasestorage.app",
  messagingSenderId: "424864421241",
  appId: "1:424864421241:web:9b5d5757d31fbcff3d0ba8",
  measurementId: "G-37KTTSHHJN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app); // Ensure you import getAuth from 'firebase/auth' if you use auth