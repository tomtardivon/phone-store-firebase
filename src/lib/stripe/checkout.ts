// src/lib/stripe/checkout.ts
import { createStripePayment } from "./run-payments";
import type { CartItem } from "@/lib/types";

export async function createCheckoutSession(
  items: CartItem[],
  userId: string,
  userEmail?: string
): Promise<string> {
  try {
    // Utiliser la nouvelle fonction qui utilise l'extension Firebase
    const sessionUrl = await createStripePayment(userId, items, {
      userEmail: userEmail || "",
    });

    return sessionUrl;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}
