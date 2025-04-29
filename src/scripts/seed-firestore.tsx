"use client";

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import { phones } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SeedFirestorePage() {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const seedProducts = async () => {
    setIsLoading(true);
    setStatus("Importation des produits en cours...");

    try {
      const productsCollection = collection(db, "products");

      // Ajouter chaque téléphone à Firestore
      const results = await Promise.all(
        phones.map(async (phone) => {
          // Ajouter des champs supplémentaires
          const productData = {
            ...phone,
            category: "smartphones",
            stock: Math.floor(Math.random() * 50) + 10, // Stock aléatoire entre 10 et 60
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          // Supprimer l'ID pour qu'il soit généré par Firestore
          const { id, ...productWithoutId } = productData;

          // Ajouter à Firestore
          const docRef = await addDoc(productsCollection, productWithoutId);

          return { id: docRef.id, name: phone.name };
        })
      );

      setStatus(`Importation réussie ! ${results.length} produits importés.`);
    } catch (error) {
      setStatus(
        `Erreur lors de l'importation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Importer les produits dans Firestore</CardTitle>
          <CardDescription>
            Migrez vos données statiques vers Firebase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="whitespace-pre-line">{status}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={seedProducts} disabled={isLoading}>
            {isLoading ? "Importation en cours..." : "Importer les produits"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
