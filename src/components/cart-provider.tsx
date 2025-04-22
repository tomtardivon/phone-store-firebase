"use client"

import type React from "react"
import { useCartStore } from "@/lib/stores/cart-store"

// Ce composant est maintenu pour la compatibilité avec le code existant
// Il expose l'API du store Zustand via un hook useCart similaire à l'original
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useCart() {
  const { items, addItem, removeItem, updateItemQuantity, clearCart } = useCartStore()
  return { items, addItem, removeItem, updateItemQuantity, clearCart }
}
