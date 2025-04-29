import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import type { CartItem } from "@/lib/types";

export async function createStripePayment(
  userId: string,
  items: CartItem[],
  metadata: Record<string, string> = {}
): Promise<string> {
  console.log("⚠️ Début de createStripePayment", { userId, items });

  return new Promise((resolve, reject) => {
    console.log("⚠️ Création du document checkout_session");

    // Vérifions d'abord si le document customer existe
    const customerRef = doc(db, "customers", userId);
    getDoc(customerRef)
      .then((customerSnap) => {
        console.log("⚠️ Customer existe?", customerSnap.exists());

        if (!customerSnap.exists()) {
          console.log("⚠️ Création du document customer");
          // Créons-le explicitement
          setDoc(customerRef, {
            email: metadata.userEmail || "customer@example.com",
            created: serverTimestamp(),
          }).then(() => console.log("⚠️ Customer créé"));
        }

        const lineItems = items.map((item) => ({
          price: "price_1RJDfW4Np321iAhFloWoVbA2", // Votre ID de prix
          quantity: item.quantity,
        }));

        console.log("⚠️ Line items:", lineItems);

        addDoc(collection(db, "customers", userId, "checkout_sessions"), {
          mode: "payment",
          line_items: lineItems,
          success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cart`,
        })
          .then((docRef) => {
            console.log("⚠️ Checkout session créée:", docRef.id);

            const unsubscribe = onSnapshot(docRef, (snap) => {
              const data = snap.data();
              console.log("⚠️ Session data:", data);

              if (data?.url) {
                console.log("⚠️ URL trouvée:", data.url);
                unsubscribe();
                resolve(data.url);
              }
            });

            setTimeout(() => {
              console.log("⚠️ Timeout déclenché après 15s");
              unsubscribe();
              reject(new Error("Timeout waiting for payment URL"));
            }, 5000);
          })
          .catch((error) => {
            console.error("⚠️ Erreur lors de la création:", error);
            reject(error);
          });
      })
      .catch((error) => {
        console.error("⚠️ Erreur lors de la vérification du customer:", error);
        reject(error);
      });
  });
}
