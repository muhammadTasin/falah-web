
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAthj-qrcHItknFZD2Kyl_kyhS5u3HRskQ",
  authDomain: "falah-a0153.firebaseapp.com",
  projectId: "falah-a0153",
  storageBucket: "falah-a0153.firebasestorage.app",
  messagingSenderId: "88486993288",
  appId: "1:88486993288:web:06f2691dfbf8b125e4ee3d",
  measurementId: "G-7E9WY6TNKP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force account selection prompt
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = getFirestore(app);
