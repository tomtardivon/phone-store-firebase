import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialiser Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Initialiser Firestore
const db = getFirestore(app)

// Connecter à l'émulateur en développement si nécessaire
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  if (typeof window !== "undefined") {
    connectFirestoreEmulator(db, "localhost", 8080)
  }
}

// Exporter l'app et db
export { app, db }

// Exporter une fonction pour obtenir auth uniquement côté client
export function getFirebaseAuth() {
  if (typeof window !== "undefined") {
    const { getAuth, connectAuthEmulator } = require("firebase/auth")
    const auth = getAuth(app)

    // Connecter à l'émulateur en développement si nécessaire
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
    }

    return auth
  }
  return null
}

// Exporter une fonction pour obtenir analytics uniquement côté client
export function getFirebaseAnalytics() {
  if (typeof window !== "undefined") {
    const { getAnalytics, isSupported } = require("firebase/analytics")

    // Vérifier si Analytics est supporté avant de l'initialiser
    return isSupported().then((supported) => {
      if (supported) {
        return getAnalytics(app)
      }
      return null
    })
  }
  return Promise.resolve(null)
}
