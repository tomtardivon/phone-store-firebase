const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

// Générer un ID de commande aléatoire
function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fonction pour les paiements Stripe
exports.onPaymentSuccess = onDocumentUpdated(
  "payments/{paymentId}",
  (event) => {
    const previousData = event.data.before.data();
    const paymentData = event.data.after.data();

    // Vérifier si le statut est passé à "succeeded"
    if (
      previousData?.status !== "succeeded" &&
      paymentData?.status === "succeeded"
    ) {
      console.log(`Payment ${event.params.paymentId} succeeded!`);

      // Récupérer l'ID utilisateur depuis les métadonnées
      const userId = paymentData.metadata?.userId;

      if (!userId) {
        console.log("No userId in metadata, skipping order creation");
        return null;
      }

      // Générer un ID de commande lisible
      const orderId = generateOrderId();

      // Extraire les informations d'adresse de livraison
      const shippingInfo = paymentData.shipping || {};
      const shippingAddress = shippingInfo.address
        ? {
            name: shippingInfo.name || "",
            address: shippingInfo.address.line1 || "",
            addressLine2: shippingInfo.address.line2 || "",
            city: shippingInfo.address.city || "",
            state: shippingInfo.address.state || "",
            postalCode: shippingInfo.address.postal_code || "",
            country: shippingInfo.address.country || "",
          }
        : null;

      // Extraire les informations client
      const customerDetails = paymentData.customer_details || {};

      // Construire les items de la commande
      const items = Array.isArray(paymentData.line_items?.data)
        ? paymentData.line_items.data.map((item) => ({
            id: item.price?.product || "",
            name: item.description || "Produit",
            price: (item.amount_total || 0) / 100 / (item.quantity || 1),
            quantity: item.quantity || 1,
            description: "",
            image: "",
          }))
        : [];

      // Si line_items n'est pas disponible, essayer avec items
      const fallbackItems = Array.isArray(paymentData.items)
        ? paymentData.items.map((item) => ({
            id: item.id || "",
            name: item.description || "Produit",
            price: (item.amount_total || 0) / 100,
            quantity: 1,
            description: item.description || "",
            image: "",
          }))
        : [];

      // Créer la commande dans Firestore
      return admin
        .firestore()
        .collection("orders")
        .doc(`#${orderId}`)
        .set({
          // Informations de la commande
          orderId: orderId,
          orderNumber: `#${orderId}`,
          userId: userId,
          items: items.length > 0 ? items : fallbackItems,
          total: (paymentData.amount_total || paymentData.amount || 0) / 100,
          status: "paid",
          paymentId: event.params.paymentId,

          // Informations client
          shippingAddress: shippingAddress,
          phone: customerDetails.phone || "",
          email: customerDetails.email || paymentData.receipt_email || "",

          // Informations de facturation
          billingAddress: paymentData.billing_details?.address
            ? {
                address: paymentData.billing_details.address.line1 || "",
                addressLine2: paymentData.billing_details.address.line2 || "",
                city: paymentData.billing_details.address.city || "",
                state: paymentData.billing_details.address.state || "",
                postalCode:
                  paymentData.billing_details.address.postal_code || "",
                country: paymentData.billing_details.address.country || "",
              }
            : null,

          // Méta-données
          paymentMethod: paymentData.payment_method_details?.type || "",
          currency: paymentData.currency || "eur",
          stripePaymentId: event.params.paymentId,

          // Timestamps
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then((ref) => {
          console.log(
            `Order #${orderId} created for payment ${event.params.paymentId}`
          );
          return null;
        })
        .catch((error) => {
          console.error("Error creating order:", error);
          return null;
        });
    }

    return null;
  }
);
