import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

// Assurez-vous que ces valeurs sont exactement celles de votre console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAy_srW0E4lybFJQlWIJvTMPXILucbZTbM",
  authDomain: "test-firebase-auth-4ad79.firebaseapp.com",
  projectId: "test-firebase-auth-4ad79",
  storageBucket: "test-firebase-auth-4ad79.appspot.com",
  messagingSenderId: "671011127362",
  appId: "1:671011127362:web:69b11a0feafea492882ddb"
}

// Initialisation correcte
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)

export { app, auth }
export const getFirebaseAuth = () => auth