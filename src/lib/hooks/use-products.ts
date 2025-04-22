import { useQuery } from "@tanstack/react-query"
import { getProducts, getProductById, getPopularProducts, searchProducts } from "@/lib/firebase/firestore"

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  })
}

export function usePopularProducts(count = 4) {
  return useQuery({
    queryKey: ["products", "popular", count],
    queryFn: () => getPopularProducts(count),
  })
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => searchProducts(query),
    enabled: query.length > 2, // Ne rechercher que si la requête a au moins 3 caractères
  })
}

export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: () => {
      if (!userId) return []
      const { getUserOrders } = require("@/lib/firebase/firestore")
      return getUserOrders(userId)
    },
    enabled: !!userId,
  })
}
