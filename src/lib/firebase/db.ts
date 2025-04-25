import { getFirestore } from "firebase/firestore"
import { app } from "./config"

// Initialisation de Firestore séparément
export const db = getFirestore(app)