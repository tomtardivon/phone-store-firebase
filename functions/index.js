const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require('firebase-admin');
admin.initializeApp();

// Fonction pour les paiements Stripe
exports.onPaymentSuccess = onDocumentUpdated("payments/{paymentId}", (event) => {
  const previousData = event.data.before.data();
  const paymentData = event.data.after.data();
  
  // Vérifier si le statut est passé à "succeeded"
  if (previousData?.status !== 'succeeded' && paymentData?.status === 'succeeded') {
    console.log(`Payment ${event.params.paymentId} succeeded!`);
    
    // Récupérer l'ID utilisateur depuis les métadonnées
    const userId = paymentData.metadata?.userId;
    
    if (!userId) {
      console.log('No userId in metadata, skipping order creation');
      return null;
    }
    
    // Créer la commande dans Firestore
    return admin.firestore().collection('orders').doc().set({
      userId: userId,
      items: Array.isArray(paymentData.line_items?.data) 
        ? paymentData.line_items.data.map(item => ({
            id: item.price?.product || '',
            name: item.description || 'Produit',
            price: (item.amount_total || 0) / 100 / (item.quantity || 1),
            quantity: item.quantity || 1,
            description: '',
            image: '',
          }))
        : [],
      total: (paymentData.amount_total || 0) / 100,
      status: "paid",
      paymentId: event.params.paymentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then(ref => {
      console.log(`Order ${ref.id} created for payment ${event.params.paymentId}`);
      return null;
    })
    .catch(error => {
      console.error('Error creating order:', error);
      return null;
    });
  }
  
  return null;
});