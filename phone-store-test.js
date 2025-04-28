// phone-store-test.js
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Métriques personnalisées
const pageLoadedRate = new Rate("page_loaded_rate");
const productLoadTime = new Trend("product_page_load_time");
const addToCartCount = new Counter("add_to_cart_count");
const checkoutAttempts = new Counter("checkout_attempts");

// Configuration du test
export const options = {
  scenarios: {
    browsing: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 }, // Montée à 50 utilisateurs en 1 minute
        { duration: "3m", target: 50 }, // Maintien de 50 utilisateurs pendant 3 minutes
        { duration: "1m", target: 0 }, // Réduction à 0 utilisateur en 1 minute
      ],
      gracefulRampDown: "30s",
    },
    shopping: {
      executor: "constant-arrival-rate",
      rate: 30, // 30 itérations par minute
      timeUnit: "1m", // 1 minute
      duration: "5m", // Pendant 5 minutes
      preAllocatedVUs: 10, // Nombre initial d'utilisateurs virtuels
      maxVUs: 50, // Maximum d'utilisateurs virtuels
    },
  },
  thresholds: {
    page_loaded_rate: ["rate>0.95"], // 95% des pages doivent charger
    product_page_load_time: ["p(95)<500"], // 95% des pages produit chargent en moins de 500ms
    http_req_duration: ["p(95)<1000"], // 95% des requêtes en moins de 1s
  },
};

// URLs de votre application
const BASE_URL = "https://phone-store-firebase-s8j4.vercel.app";
const PRODUCT_IDS = ["phone-1", "phone-2", "phone-3", "phone-4"];

export default function () {
  const sessionId = Math.random().toString(36).substring(2);

  group("01_HomePage", function () {
    const homeRes = http.get(BASE_URL);
    pageLoadedRate.add(homeRes.status === 200);
    sleep(Math.random() * 3 + 2); // 2-5 secondes sur la page d'accueil
  });

  group("02_ProductsPage", function () {
    const productsRes = http.get(`${BASE_URL}/products`);
    pageLoadedRate.add(productsRes.status === 200);
    sleep(Math.random() * 2 + 1); // 1-3 secondes sur la page produits
  });

  // Sélection aléatoire d'un produit
  const randomProduct =
    PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];

  group("03_ProductDetailPage", function () {
    const start = new Date();
    const productRes = http.get(`${BASE_URL}/products/${randomProduct}`);
    const loadTime = new Date() - start;

    productLoadTime.add(loadTime);
    pageLoadedRate.add(productRes.status === 200);
    sleep(Math.random() * 5 + 3); // 3-8 secondes à examiner le produit
  });

  // 30% de chance d'ajouter au panier
  if (Math.random() < 0.3) {
    group("04_AddToCart", function () {
      // Simulation d'un appel API pour ajouter au panier
      const payload = JSON.stringify({
        productId: randomProduct,
        quantity: 1,
        sessionId: sessionId,
      });

      const headers = { "Content-Type": "application/json" };
      const cartRes = http.post(`${BASE_URL}/api/cart/add`, payload, {
        headers,
      });

      if (cartRes.status >= 200 && cartRes.status < 300) {
        addToCartCount.add(1);
      }

      sleep(1);
    });

    group("05_ViewCart", function () {
      const cartPageRes = http.get(`${BASE_URL}/cart`);
      pageLoadedRate.add(cartPageRes.status === 200);
      sleep(Math.random() * 3 + 2);
    });

    // 20% de chance de procéder au paiement
    if (Math.random() < 0.2) {
      group("06_Checkout", function () {
        checkoutAttempts.add(1);

        // Simulation de tentative de paiement
        const checkoutRes = http.get(`${BASE_URL}/checkout`);
        pageLoadedRate.add(checkoutRes.status === 200);
        sleep(2);
      });
    }
  }

  // Attente entre les sessions
  sleep(Math.random() * 3 + 2);
}