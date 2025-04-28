// Exemple de ce que pourrait être votre cart store
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === product.id
          );

          // S'assurer que le produit a un nom valide
          const validatedProduct = {
            ...product,
            name: product.name || product.title || `Produit ${product.id}`, // Vérifier si 'title' est utilisé au lieu de 'name'
            price: product.price || 0,
            quantity: 1,
          };

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return { items: [...state.items, validatedProduct] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateItemQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
    }
  )
);
