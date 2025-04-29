import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  features?: string[];
  category?: string;
  stock?: number;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id?: string;
  orderNumber?: string; // Format convivial #ABC123
  orderId?: string; // ID sans le # (ABC123)
  userId: string;
  items: CartItem[];
  total: number;
  status: "paid" | "processing" | "shipped" | "delivered";
  paymentId: string;
  stripePaymentId?: string; // ID du paiement Stripe
  currency?: string; // Devise (EUR, USD, etc.)

  // Informations de livraison et contact
  shippingAddress?: {
    name: string;
    address: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  email?: string;

  // Informations de facturation
  billingAddress?: {
    address: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

  // Méthode et détails de paiement
  paymentMethod?: string;

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  addresses?: {
    id: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[];
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "succeeded"
    | "canceled";
  clientSecret: string;
  currency: string;
  createdAt: Date | Timestamp;
}
