import type { Timestamp } from "firebase/firestore"

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  features?: string[]
  category?: string
  stock?: number
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export interface CartItem extends Product {
  quantity: number
}

export interface Order {
  id?: string
  userId: string
  items: CartItem[]
  total: number
  status: "paid" | "processing" | "shipped" | "delivered"
  paymentId: string
  shippingAddress?: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export interface User {
  id: string
  displayName: string
  email: string
  phoneNumber?: string
  addresses?: {
    id: string
    name: string
    address: string
    city: string
    postalCode: string
    country: string
    isDefault: boolean
  }[]
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
}

export interface PaymentIntent {
  id: string
  amount: number
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "succeeded"
    | "canceled"
  clientSecret: string
  currency: string
  createdAt: Date | Timestamp
}
