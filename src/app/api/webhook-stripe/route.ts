import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase/admin";
import type { CartItem } from "@/lib/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  if (!adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin not initialized" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No stripe signature found" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Récupérer les détails de la session
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["line_items"],
        }
      );

      // Extraire les informations nécessaires
      const userId = session.metadata?.userId;
      const lineItems = sessionWithLineItems.line_items?.data || [];

      if (!userId) {
        throw new Error("UserId not found in session metadata");
      }

      // Construire les items de la commande avec le bon prix
      const items: CartItem[] = await Promise.all(
        lineItems.map(async (item) => {
          return {
            id: item.id,
            name: item.description || "Unknown product",
            price: (item.price?.unit_amount || 0) / 100, // Utiliser unit_amount au lieu de amount_total
            quantity: item.quantity || 1,
            description: "",
            image: "",
          };
        })
      );

      // Vérifier si la commande existe déjà pour éviter les doublons
      const existingOrderQuery = await adminDb
        .collection("orders")
        .where("paymentId", "==", session.payment_intent)
        .get();

      if (!existingOrderQuery.empty) {
        console.log(
          `Order already exists for payment ${session.payment_intent}`
        );
        return NextResponse.json({ received: true });
      }

      // Récupérer ou créer le customer Stripe et l'associer à l'utilisateur
      if (session.customer && typeof session.customer === "string") {
        await adminDb
          .collection("users")
          .doc(userId)
          .set({ stripeCustomerId: session.customer }, { merge: true });
      }

      // Créer la commande dans Firestore
      const orderData = {
        userId,
        items,
        total: session.amount_total ? session.amount_total / 100 : 0,
        status: "paid",
        paymentId: session.payment_intent as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Ajouter l'adresse de livraison seulement si elle existe
      if (session.shipping_details && session.shipping_details.address) {
        Object.assign(orderData, {
          shippingAddress: {
            name: session.shipping_details.name || "",
            address: session.shipping_details.address.line1 || "",
            city: session.shipping_details.address.city || "",
            postalCode: session.shipping_details.address.postal_code || "",
            country: session.shipping_details.address.country || "",
          },
        });
      }

      const docRef = await adminDb.collection("orders").add(orderData);
      console.log(`✅ Order ${docRef.id} created for user ${userId}`);
    } catch (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Error processing webhook" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

// Configuration pour désactiver le bodyParser Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};
