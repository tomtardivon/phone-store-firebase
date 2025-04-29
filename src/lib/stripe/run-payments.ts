// src/lib/stripe/run-payments.ts (nouveau fichier)
import {
  collection,
  addDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import type { CartItem } from "@/lib/types";

export async function createStripePayment(
  userId: string,
  items: CartItem[],
  metadata: Record<string, string> = {}
) {
  try {
    // Comme vous avez activé la synchronisation, pas besoin de vérifier si le client existe

    // Créer le paiement
    const lineItems = items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
          description: item.description || "",
          images: item.image ? [item.image] : [],
        },
      },
    }));

    // Ajouter le paiement à la collection payments (gérée par l'extension)
    const paymentRef = await addDoc(collection(db, "payments"), {
      customerId: userId,
      amount:
        items.reduce((total, item) => total + item.price * item.quantity, 0) *
        100,
      currency: "eur",
      payment_method_types: ["card"],
      mode: "payment",
      status: "initial",
      line_items: lineItems,
      metadata: {
        ...metadata,
        userId,
      },
      success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/cart`,
    });

    // Attendre que l'extension mette à jour le document avec l'URL de checkout
    let attempts = 0;
    while (attempts < 5) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedPaymentSnap = await getDoc(paymentRef);
      const paymentData = updatedPaymentSnap.data();

      if (paymentData?.url) {
        return paymentData.url;
      }

      attempts++;
    }

    throw new Error("Timeout waiting for payment URL");
  } catch (error) {
    console.error("Error creating Stripe payment:", error);
    throw error;
  }
}
