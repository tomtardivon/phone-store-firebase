import { initializeApp, getApps } from "firebase/app"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy_srW0E4lybFJQlWIJvTMPXILucbZTbM",
  authDomain: "test-firebase-auth-4ad79.firebaseapp.com",
  projectId: "test-firebase-auth-4ad79",
  storageBucket: "test-firebase-auth-4ad79.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual value
  appId: "YOUR_APP_ID", // Replace with your actual value
}

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
