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
} from "firebase/firestore";
import { db } from "./db";
import type { Product, Order } from "@/lib/types";

// Récupérer tous les produits
export async function getProducts(): Promise<Product[]> {
  // Utiliser directement les données locales
  const { phones } = await import("@/lib/data");
  return phones;
}

// Récupérer un produit par son ID
export async function getProductById(id: string): Promise<Product | null> {
  // Utiliser directement les données locales
  const { phones } = await import("@/lib/data");
  return phones.find((phone) => phone.id === id) || null;
}

// Enregistrer une commande
export async function saveOrder(orderData: Omit<Order, "id">): Promise<string> {
  try {
    const orderRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: orderData.status || "paid",
    });

    // Mettre à jour le stock des produits
    for (const item of orderData.items) {
      const productRef = doc(db, "products", item.id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const currentStock = productSnap.data().stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return orderRef.id;
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
}

// Récupérer les commandes d'un utilisateur
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    // Essayer les deux variations (userId et userID) pour la compatibilité
    let querySnapshot = await getDocs(
      query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      )
    );

    if (querySnapshot.empty) {
      // Si aucun résultat, essayer avec "userID" (majuscule)
      querySnapshot = await getDocs(
        query(
          collection(db, "orders"),
          where("userID", "==", userId),
          orderBy("createdAt", "desc")
        )
      );
    }

    const orders: Order[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId || data.userID,
        items: data.items,
        total: data.total,
        status: data.status,
        paymentId: data.paymentId || data.paymentID,
        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
      });
    });

    return orders;
  } catch (error) {
    console.error("Error getting user orders:", error);
    // Si l'erreur est due à l'absence d'index, essayer sans orderBy
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "orders"), where("userId", "==", userId))
      );

      if (querySnapshot.empty) {
        // Si aucun résultat, essayer avec "userID" (majuscule)
        const querySnapshot2 = await getDocs(
          query(collection(db, "orders"), where("userID", "==", userId))
        );

        const orders: Order[] = [];
        querySnapshot2.forEach((doc) => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            userId: data.userId || data.userID,
            items: data.items,
            total: data.total,
            status: data.status,
            paymentId: data.paymentId || data.paymentID,
            createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
          });
        });

        // Trier manuellement par date
        return orders.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      }

      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          userId: data.userId || data.userID,
          items: data.items,
          total: data.total,
          status: data.status,
          paymentId: data.paymentId || data.paymentID,
          createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
        });
      });

      // Trier manuellement par date
      return orders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (fallbackError) {
      console.error("Error getting user orders (fallback):", fallbackError);
      throw fallbackError;
    }
  }
}

// Récupérer une commande par son ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));

    if (!orderDoc.exists()) {
      return null;
    }

    const data = orderDoc.data();
    return {
      id: orderDoc.id,
      userId: data.userId,
      items: data.items,
      total: data.total,
      status: data.status,
      paymentId: data.paymentId,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
}

// Récupérer les produits populaires
export async function getPopularProducts(count = 4): Promise<Product[]> {
  // Utiliser directement les données locales
  const { phones } = await import("@/lib/data");
  return phones.slice(0, count);
}

// Rechercher des produits
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    // Note: Firestore n'a pas de recherche de texte intégrale
    // Pour une vraie recherche, vous devriez utiliser Algolia ou un service similaire
    // Ceci est une implémentation simplifiée
    const productsRef = collection(db, "products");
    const querySnapshot = await getDocs(productsRef);

    const products: Product[] = [];
    const searchLower = query.toLowerCase();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.name.toLowerCase().includes(searchLower) ||
        data.description.toLowerCase().includes(searchLower)
      ) {
        products.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          price: data.price,
          image: data.image,
          features: data.features || [],
        });
      }
    });

    return products;
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}
