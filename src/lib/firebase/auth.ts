"use client"
import { getFirebaseAuth } from "./config"
import { useAuth } from "@/components/auth-provider"

// Fonction pour obtenir l'instance auth côté client
export function getAuth() {
  return getFirebaseAuth()
}

// Réexporter le hook useAuth pour faciliter l'importation
export { useAuth }
