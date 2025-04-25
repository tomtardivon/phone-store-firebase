// src/app/api/stripe-portal/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Vérification de la configuration Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not defined in environment variables");
}

let stripe: Stripe | null = null;

try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Please check your environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    const { userId, userEmail } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "UserId and email are required" },
        { status: 400 }
      );
    }

    // Rechercher si un customer existe déjà avec cet email
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      customer = customers.data[0];
    } catch (error) {
      console.error("Error listing customers:", error);
    }

    // Si aucun customer n'existe, en créer un nouveau
    if (!customer) {
      try {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            firebaseUID: userId,
          },
        });
      } catch (error) {
        console.error("Error creating customer:", error);
        throw new Error("Failed to create Stripe customer");
      }
    }

    // Créer une session du portail client
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/account`,
      });

      if (!session.url) {
        throw new Error("Stripe portal session URL not generated");
      }

      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);

      if (error instanceof Stripe.errors.StripeError) {
        if (error.type === "StripePermissionError") {
          return NextResponse.json(
            {
              error:
                "Le portail client n'est pas activé. Veuillez l'activer dans votre dashboard Stripe.",
            },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: error.message, type: error.type },
          { status: 500 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in stripe-portal API:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la session du portail",
      },
      { status: 500 }
    );
  }
}
