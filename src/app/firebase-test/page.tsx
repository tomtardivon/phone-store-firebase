"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<string>("Vérification de la connexion...")
  const [testResult, setTestResult] = useState<string>("")

  useEffect(() => {
    // Vérifier la connexion à Firebase
    try {
      if (db) {
        setStatus("Firebase Firestore connecté !")
      } else {
        setStatus("Erreur: Firestore non initialisé")
      }
    } catch (error) {
      setStatus(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  const testFirestore = async () => {
    try {
      // Créer une collection de test
      const testCollection = collection(db, "test")

      // Ajouter un document
      const testDoc = await addDoc(testCollection, {
        message: "Test réussi",
        timestamp: new Date(),
      })

      // Lire les documents
      const querySnapshot = await getDocs(testCollection)
      const documents = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      setTestResult(`Test réussi ! Document créé avec ID: ${testDoc.id}. 
        Nombre total de documents: ${documents.length}`)
    } catch (error) {
      setTestResult(`Erreur lors du test: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Firebase</CardTitle>
          <CardDescription>Vérifiez que Firebase est correctement configuré</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="font-medium">Statut:</p>
            <p className={status.includes("Erreur") ? "text-red-500" : "text-green-500"}>{status}</p>
          </div>
          {testResult && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="whitespace-pre-line">{testResult}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={testFirestore}>Tester Firestore</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
