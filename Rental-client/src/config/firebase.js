// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBOJY89OJFF7t9Ged2Umx98IGMG6dHAbVk",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "shree-sai-engineering.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "shree-sai-engineering",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "shree-sai-engineering.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "933234760510",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:933234760510:web:c217cd7e59710f2ada6a6f"
  // apiKey: "AIzaSyBOJY89OJFF7t9Ged2Umx98IGMG6dHAbVk",
  // authDomain: "shree-sai-engineering.firebaseapp.com",
  // projectId: "shree-sai-engineering",
  // storageBucket: "shree-sai-engineering.firebasestorage.app",
  // messagingSenderId: "933234760510",
  // appId: "1:933234760510:web:c217cd7e59710f2ada6a6f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);