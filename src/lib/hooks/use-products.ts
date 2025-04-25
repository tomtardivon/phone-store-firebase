import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  getPopularProducts,
  searchProducts,
} from "@/lib/firebase/firestore";
import type { Product } from "@/lib/types";

// Fonction de validation simplifiée sans debug
function validateAndCleanProduct(product: any): Product {
  return {
    ...product,
    name: product.name?.trim() || `Produit ${product.id}`,
    description: product.description || "",
    price: typeof product.price === "number" ? product.price : 0,
    quantity: typeof product.quantity === "number" ? product.quantity : 1,
    image: product.image || "",
    category: product.category || "autres",
    stock: typeof product.stock === "number" ? product.stock : 0,
    createdAt: product.createdAt || new Date(),
    updatedAt: product.updatedAt || new Date(),
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const products = await getProducts();
      return products.map(validateAndCleanProduct);
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const product = await getProductById(id);
      if (!product) return null;
      return validateAndCleanProduct(product);
    },
    enabled: !!id,
  });
}

export function usePopularProducts(count = 4) {
  return useQuery({
    queryKey: ["products", "popular", count],
    queryFn: async () => {
      const products = await getPopularProducts(count);
      return products.map(validateAndCleanProduct);
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: async () => {
      const products = await searchProducts(query);
      return products.map(validateAndCleanProduct);
    },
    enabled: query.length > 2,
  });
}

export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: () => {
      if (!userId) return [];
      const { getUserOrders } = require("@/lib/firebase/firestore");
      return getUserOrders(userId);
    },
    enabled: !!userId,
  });
}
