import type { CartItem } from "@/lib/types";

export async function createCheckoutSession(
  items: CartItem[],
  userId: string,
  userEmail?: string
): Promise<string> {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items, userId, userEmail }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création de la session de paiement");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}