"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase/config"

interface AuthContextType {
  user: User | null
  loading: boolean
  createUser: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState<any>(null)

  // Initialiser auth côté client uniquement
  useEffect(() => {
    const auth = getFirebaseAuth()
    setAuth(auth)

    if (auth) {
      // Configurer la persistance locale pour une meilleure expérience utilisateur
      setPersistence(auth, browserLocalPersistence).catch(console.error)

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
        setLoading(false)
      })

      return () => unsubscribe()
    } else {
      setLoading(false)
    }
  }, [])

  const createUser = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error("Auth not initialized")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized")

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Auth not initialized")

    try {
      const provider = new GoogleAuthProvider()
      // Ajouter des scopes supplémentaires si nécessaire
      provider.addScope("profile")
      provider.addScope("email")

      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }
  }

  const signOut = async () => {
    if (!auth) throw new Error("Auth not initialized")

    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, createUser, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
