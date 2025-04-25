"use client"

import { useState } from "react"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/db"
import { phones } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function SeedFirebasePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [existingProducts, setExistingProducts] = useState<number>(0)

  const checkExistingProducts = async () => {
    try {
      const productsRef = collection(db, "products")
      const snapshot = await getDocs(productsRef)
      return snapshot.size
    } catch (error) {
      console.error("Error checking existing products:", error)
      return 0
    }
  }

  const seedProducts = async () => {
    setStatus("loading")
    setMessage("Vérification des produits existants...")

    try {
      // Vérifier d'abord s'il y a déjà des produits
      const existingCount = await checkExistingProducts()
      setExistingProducts(existingCount)

      if (existingCount > 0) {
        setStatus("error")
        setMessage(`Il y a déjà ${existingCount} produits dans la base de données. Voulez-vous vraiment ajouter plus de produits ?`)
        return
      }

      // Ajouter les produits
      setMessage("Ajout des produits en cours...")
      const productsRef = collection(db, "products")
      
      for (const phone of phones) {
        await addDoc(productsRef, {
          ...phone,
          createdAt: new Date(),
          updatedAt: new Date(),
          stock: 50 // Ajout d'un stock par défaut
        })
      }

      setStatus("success")
      setMessage(`${phones.length} produits ont été ajoutés avec succès !`)
    } catch (error) {
      setStatus("error")
      setMessage(`Erreur lors de l'ajout des produits: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  const forceAddProducts = async () => {
    setStatus("loading")
    setMessage("Ajout forcé des produits en cours...")

    try {
      const productsRef = collection(db, "products")
      
      for (const phone of phones) {
        await addDoc(productsRef, {
          ...phone,
          createdAt: new Date(),
          updatedAt: new Date(),
          stock: 50
        })
      }

      setStatus("success")
      setMessage(`${phones.length} produits ont été ajoutés avec succès !`)
    } catch (error) {
      setStatus("error")
      setMessage(`Erreur lors de l'ajout des produits: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Initialiser Firebase avec les produits locaux</CardTitle>
          <CardDescription>
            Cette page permet de pousser vos données locales vers Firebase Firestore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Produits locaux disponibles : {phones.length}</p>
            {existingProducts > 0 && (
              <p>Produits déjà dans Firebase : {existingProducts}</p>
            )}
          </div>

          {status !== "idle" && (
            <Alert variant={status === "error" ? "destructive" : "default"}>
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {status === "error" && <XCircle className="h-4 w-4" />}
              <AlertTitle>
                {status === "loading" && "Opération en cours"}
                {status === "success" && "Succès"}
                {status === "error" && "Erreur"}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button 
            onClick={seedProducts} 
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Initialiser Firebase"
            )}
          </Button>
          
          {status === "error" && existingProducts > 0 && (
            <Button 
              variant="destructive"
              onClick={forceAddProducts} 
              disabled={status === "loading"}
            >
              Forcer l'ajout
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}