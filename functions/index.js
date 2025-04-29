const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

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
      console.log("Payment data:", JSON.stringify(paymentData, null, 2));

      // Récupérer l'ID utilisateur depuis les métadonnées
      const userId = paymentData.metadata?.userId;

      if (!userId) {
        console.log("No userId in metadata, skipping order creation");
        return null;
      }

      // Extraire les informations d'adresse de livraison
      const shippingAddress = paymentData.shipping
        ? {
            name: paymentData.shipping.name || "",
            address: paymentData.shipping.address?.line1 || "",
            addressLine2: paymentData.shipping.address?.line2 || "",
            city: paymentData.shipping.address?.city || "",
            state: paymentData.shipping.address?.state || "",
            postalCode: paymentData.shipping.address?.postal_code || "",
            country: paymentData.shipping.address?.country || "",
          }
        : null;

      // Extraire le numéro de téléphone
      const phone = paymentData.customer_details?.phone || "";

      // Créer la commande dans Firestore avec adresse et téléphone
      return admin
        .firestore()
        .collection("orders")
        .doc()
        .set({
          userId: userId,
          items: Array.isArray(paymentData.line_items?.data)
            ? paymentData.line_items.data.map((item) => ({
                id: item.price?.product || "",
                name: item.description || "Produit",
                price: (item.amount_total || 0) / 100 / (item.quantity || 1),
                quantity: item.quantity || 1,
                description: "",
                image: "",
              }))
            : [],
          total: (paymentData.amount_total || 0) / 100,
          status: "paid",
          paymentId: event.params.paymentId,
          // Ajouter l'adresse de livraison si disponible
          shippingAddress: shippingAddress,
          // Ajouter le numéro de téléphone si disponible
          phone: phone,
          // Ajouter l'email du client
          email: paymentData.customer_details?.email || "",
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
          // Méthode de paiement utilisée
          paymentMethod: paymentData.payment_method_details?.type || "",
          // Timestamps
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then((ref) => {
          console.log(
            `Order ${ref.id} created for payment ${event.params.paymentId} with shipping info`
          );

          // Envoyer éventuellement un email de confirmation
          // sendOrderConfirmationEmail(userId, ref.id);

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
