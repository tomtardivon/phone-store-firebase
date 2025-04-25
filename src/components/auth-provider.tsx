"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  createUser: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<any>(null);

  // Initialiser auth côté client uniquement
  useEffect(() => {
    const auth = getFirebaseAuth();
    setAuth(auth);

    if (auth) {
      // Configurer la persistance locale pour une meilleure expérience utilisateur
      setPersistence(auth, browserLocalPersistence).catch(console.error);

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      // Gérer le résultat de redirection
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            console.log("Successfully signed in via redirect:", result.user);
            setUser(result.user);
          }
        })
        .catch((error) => {
          console.error("Redirect result error:", error);
        });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const createUser = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    if (!auth) throw new Error("Auth not initialized");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Auth not initialized");

    try {
      const provider = new GoogleAuthProvider();

      // Ne spécifiez PAS de client ID manuellement - laissez Firebase gérer
      provider.setCustomParameters({
        prompt: "select_account",
      });

      // Ajouter les scopes basiques
      provider.addScope("profile");
      provider.addScope("email");

      // Essayer d'abord avec popup (meilleure UX)
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Google sign-in successful with popup");
        return result;
      } catch (popupError: any) {
        console.log("Popup failed:", popupError.code);

        // Si le popup échoue, utiliser redirect comme fallback
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/cancelled-popup-request" ||
          popupError.code === "auth/popup-closed-by-user"
        ) {
          console.log("Attempting sign-in with redirect...");
          return signInWithRedirect(auth, provider);
        }

        // Si c'est une autre erreur, la propager
        throw popupError;
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) throw new Error("Auth not initialized");

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, createUser, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
