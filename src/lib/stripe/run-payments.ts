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

export async function createStripePayment(
  userId: string,
  items: CartItem[],
  metadata: Record<string, string> = {}
): Promise<string> {
  console.log("Creating Stripe payment", { userId, items });

  return new Promise((resolve, reject) => {
    // Vérifions d'abord si le document customer existe
    const customerRef = doc(db, "customers", userId);

    getDoc(customerRef)
      .then((customerSnap) => {
        if (!customerSnap.exists()) {
          // Créons-le explicitement
          return setDoc(customerRef, {
            email: metadata.userEmail || "",
            created: serverTimestamp(),
          }).then(() => console.log("Customer document created"));
        }
      })
      .then(() => {
        // Convertir les produits en line_items en utilisant les données dynamiques
        const line_items = items.map((item) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              description: item.description || undefined,
              // Vous pouvez ajouter images[] si vous avez des images
              metadata: {
                productId: item.id,
              },
            },
            unit_amount: Math.round(item.price * 100), // Convertir en centimes
          },
          quantity: item.quantity,
        }));

        console.log("Creating checkout session with line items", line_items);

        // Créer la session de checkout
        return addDoc(
          collection(db, "customers", userId, "checkout_sessions"),
          {
            mode: "payment",
            line_items: line_items,
            success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
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
            // Options de livraison (force l'affichage du formulaire d'adresse)
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
              setup_future_usage: "off_session", // Optionnel: permet de sauvegarder le moyen de paiement
            },
            // Optionnel: informations sur le client
            customer_creation: "always",
            // Envoyer les métadonnées
            metadata: {
              userId: userId,
              ...metadata,
            },
          }
        );
      })
      .then((docRef) => {
        console.log("Checkout session document created:", docRef.id);

        // Écouter les mises à jour du document
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

        // Augmenter le timeout à 30 secondes pour donner plus de temps à l'extension
        setTimeout(() => {
          console.log("Timeout reached after 30s");
          unsubscribe();
          reject(
            new Error(
              "Timeout waiting for payment URL. Vérifiez que l'extension Stripe est correctement configurée."
            )
          );
        }, 30000); // 30 secondes au lieu de 5
      })
      .catch((error) => {
        console.error("Error creating checkout session:", error);
        reject(error);
      });
  });
}
