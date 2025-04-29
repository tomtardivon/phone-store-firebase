// src/lib/stripe/run-payments.ts
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import type { CartItem } from "@/lib/types";

/**
 * Crée une session de paiement Stripe en utilisant l'extension Firebase
 * Les données de commande seront accessibles via 'customers/{userId}/payments/{paymentId}'
 * après un paiement réussi
 */

export async function createStripePayment(
  userId: string,
  items: CartItem[],
  metadata: Record<string, string> = {}
): Promise<string> {
  console.log("Creating Stripe payment", { userId, items });

  return new Promise((resolve, reject) => {
    // Vérifier si le document customer existe
    const customerRef = doc(db, "customers", userId);

    getDoc(customerRef)
      .then((customerSnap) => {
        if (!customerSnap.exists()) {
          // Le créer explicitement si nécessaire
          return setDoc(customerRef, {
            email: metadata.userEmail || "",
            created: serverTimestamp(),
          }).then(() => console.log("Customer document created"));
        }
      })
      .then(() => {
        // Convertir les produits en line_items pour Stripe
        const line_items = items.map((item) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              description: item.description || undefined,
              // Ajouter des images si disponibles
              images: item.image ? [item.image] : undefined,
              metadata: {
                productId: item.id,
              },
            },
            unit_amount: Math.round(item.price * 100), // Convertir en centimes
          },
          quantity: item.quantity,
        }));

        console.log("Creating checkout session with line items", line_items);

        // Créer la session de checkout via l'extension Stripe
        return addDoc(
          collection(db, "customers", userId, "checkout_sessions"),
          {
            mode: "payment",
            line_items: line_items,
            success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}`,
            cancel_url: `${window.location.origin}/cart`,
            // Collecte de l'adresse de livraison
            shipping_address_collection: {
              allowed_countries: [
                "FR",
                "BE",
                "CH",
                "LU",
                "DE",
                "ES",
                "IT",
                "GB",
              ],
            },
            // Options de livraison
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  fixed_amount: {
                    amount: 0,
                    currency: "eur",
                  },
                  display_name: "Livraison standard gratuite",
                  delivery_estimate: {
                    minimum: {
                      unit: "business_day",
                      value: 3,
                    },
                    maximum: {
                      unit: "business_day",
                      value: 5,
                    },
                  },
                },
              },
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  fixed_amount: {
                    amount: 500, // 5€
                    currency: "eur",
                  },
                  display_name: "Livraison express",
                  delivery_estimate: {
                    minimum: {
                      unit: "business_day",
                      value: 1,
                    },
                    maximum: {
                      unit: "business_day",
                      value: 2,
                    },
                  },
                },
              },
            ],
            // Collecte du numéro de téléphone
            phone_number_collection: {
              enabled: true,
            },
            // Collecte du nom pour carte bancaire
            payment_intent_data: {
              // Ne pas enregistrer la carte pour usage futur
              setup_future_usage: null,
              // Permet de retrouver les informations plus facilement
              metadata: {
                userId: userId,
                ...metadata,
              },
            },
            // Créer un nouveau client si nécessaire
            customer_creation: "always",
            // Métadonnées pour la session
            metadata: {
              userId: userId,
              ...metadata,
            },
            // Active la page de confirmation de commande
            allow_promotion_codes: true,
            // Inclure les taxes automatiquement selon le pays
            automatic_tax: { enabled: true },
          }
        );
      })
      .then((docRef) => {
        console.log("Checkout session document created:", docRef.id);

        // Écouter les mises à jour du document pour obtenir l'URL
        const unsubscribe = onSnapshot(docRef, (snap) => {
          const data = snap.data();
          console.log("Session data update:", data);

          if (data?.error) {
            console.error("Stripe error:", data.error);
            unsubscribe();
            reject(new Error(data.error.message || "Payment session error"));
          }

          if (data?.url) {
            console.log("Redirect URL received:", data.url);
            unsubscribe();
            resolve(data.url);
          }
        });

        // Timeout en cas de problème
        setTimeout(() => {
          console.log("Timeout reached after 30s");
          unsubscribe();
          reject(
            new Error(
              "Timeout waiting for payment URL. Vérifiez que l'extension Stripe est correctement configurée."
            )
          );
        }, 30000);
      })
      .catch((error) => {
        console.error("Error creating checkout session:", error);
        reject(error);
      });
  });
}
