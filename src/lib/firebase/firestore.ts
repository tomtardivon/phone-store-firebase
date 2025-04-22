import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  updateDoc,
} from "firebase/firestore"
import { db } from "./config"
import type { Product, Order } from "@/lib/types"

// Récupérer tous les produits
export async function getProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const querySnapshot = await getDocs(productsRef)

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        features: data.features || [],
      })
    })

    return products
  } catch (error) {
    console.error("Error getting products:", error)
    // Fallback aux données statiques en cas d'erreur
    const { phones } = await import("@/lib/data")
    return phones
  }
}

// Récupérer un produit par son ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const productRef = doc(db, "products", id)
    const productSnap = await getDoc(productRef)

    if (!productSnap.exists()) {
      return null
    }

    const data = productSnap.data()
    return {
      id: productSnap.id,
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image,
      features: data.features || [],
    }
  } catch (error) {
    console.error("Error getting product:", error)
    // Fallback aux données statiques en cas d'erreur
    const { phones } = await import("@/lib/data")
    return phones.find((phone) => phone.id === id) || null
  }
}

// Enregistrer une commande
export async function saveOrder(orderData: Omit<Order, "id">): Promise<string> {
  try {
    const orderRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: orderData.status || "paid",
    })

    // Mettre à jour le stock des produits
    for (const item of orderData.items) {
      const productRef = doc(db, "products", item.id)
      const productSnap = await getDoc(productRef)

      if (productSnap.exists()) {
        const currentStock = productSnap.data().stock || 0
        const newStock = Math.max(0, currentStock - item.quantity)

        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp(),
        })
      }
    }

    return orderRef.id
  } catch (error) {
    console.error("Error saving order:", error)
    throw error
  }
}

// Récupérer les commandes d'un utilisateur
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const orders: Order[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      orders.push({
        id: doc.id,
        userId: data.userId,
        items: data.items,
        total: data.total,
        status: data.status,
        paymentId: data.paymentId,
        createdAt: data.createdAt?.toDate() || new Date(),
      })
    })

    return orders
  } catch (error) {
    console.error("Error getting user orders:", error)
    throw error
  }
}

// Récupérer une commande par son ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId))

    if (!orderDoc.exists()) {
      return null
    }

    const data = orderDoc.data()
    return {
      id: orderDoc.id,
      userId: data.userId,
      items: data.items,
      total: data.total,
      status: data.status,
      paymentId: data.paymentId,
      createdAt: data.createdAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error getting order:", error)
    throw error
  }
}

// Récupérer les produits populaires
export async function getPopularProducts(count = 4): Promise<Product[]> {
  try {
    // Dans un vrai système, vous pourriez avoir un champ "popularity" ou utiliser le nombre de ventes
    const productsRef = collection(db, "products")
    const q = query(productsRef, limit(count))
    const querySnapshot = await getDocs(q)

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        features: data.features || [],
      })
    })

    return products
  } catch (error) {
    console.error("Error getting popular products:", error)
    // Fallback aux données statiques en cas d'erreur
    const { phones } = await import("@/lib/data")
    return phones.slice(0, count)
  }
}

// Rechercher des produits
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    // Note: Firestore n'a pas de recherche de texte intégrale
    // Pour une vraie recherche, vous devriez utiliser Algolia ou un service similaire
    // Ceci est une implémentation simplifiée
    const productsRef = collection(db, "products")
    const querySnapshot = await getDocs(productsRef)

    const products: Product[] = []
    const searchLower = query.toLowerCase()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.name.toLowerCase().includes(searchLower) || data.description.toLowerCase().includes(searchLower)) {
        products.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          price: data.price,
          image: data.image,
          features: data.features || [],
        })
      }
    })

    return products
  } catch (error) {
    console.error("Error searching products:", error)
    return []
  }
}
