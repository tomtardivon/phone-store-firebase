// phone-store-test.js - Version corrigée
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend, Gauge } from "k6/metrics";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Métriques
const pageLoadedRate = new Rate("page_loaded_rate");
const productLoadTime = new Trend("product_page_load_time");
const addToCartCount = new Counter("add_to_cart_count");
const checkoutAttempts = new Counter("checkout_attempts");
const activeUsers = new Gauge("active_users");
const serverErrors = new Counter("server_errors");

// URL de l'application - configurable via variable d'environnement
const BASE_URL =
  __ENV.BASE_URL || "https://phone-store-firebase-s8j4.vercel.app";
const PRODUCT_IDS = ["phone-1", "phone-2", "phone-3", "phone-4"];

// Configuration du test
export const options = {
  scenarios: {
    // Simulation de navigation
    browsing: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 25 }, // Montée plus douce
        { duration: "1m", target: 50 }, // Montée à 50 utilisateurs
        { duration: "1m", target: 50 }, // Maintien à 50 utilisateurs - réduit pour le debug
        { duration: "30s", target: 0 }, // Réduction progressive
      ],
      gracefulRampDown: "30s",
      tags: { scenario: "browsing" },
    },

    // Simulation d'achats simplifiée
    shopping: {
      executor: "constant-vus", // Changé de constant-arrival-rate à constant-vus
      vus: 10, // Nombre d'utilisateurs constant
      duration: "2m", // Durée réduite pour le debug
      startTime: "1m30s", // Commence après la montée du premier scénario
      tags: { scenario: "shopping" },
    },
  },

  thresholds: {
    http_req_duration: ["p(95)<1000"], // 95% des requêtes en moins de 1s
    http_req_failed: ["rate<0.01"], // Moins de 1% d'erreurs
  },

  // Sortie des résultats dans plusieurs formats
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

// Fonctions utilitaires
function tagRequest(url) {
  const tags = {
    staticAsset:
      url.includes(".js") ||
      url.includes(".css") ||
      url.includes(".jpg") ||
      url.includes(".png") ||
      url.includes(".svg"),
  };
  return tags;
}

export function setup() {
  // Vérification initiale du site
  console.log(`Testing site: ${BASE_URL}`);
  const response = http.get(BASE_URL);
  check(response, {
    "Site is accessible": (r) => r.status === 200,
  });

  return {
    startTime: new Date().toISOString(),
  };
}

export default function (data) {
  // Génération d'un ID de session unique par utilisateur
  const sessionId = Math.random().toString(36).substring(2);

  // Mettre à jour le nombre d'utilisateurs actifs
  activeUsers.add(1);

  group("01_HomePage", function () {
    const homeRes = http.get(BASE_URL, { tags: tagRequest(BASE_URL) });
    check(homeRes, {
      "Homepage loaded successfully": (r) => r.status === 200,
      "Homepage has correct title": (r) => r.body.includes("TéléStore"),
    });
    pageLoadedRate.add(homeRes.status === 200);

    // Vérification des erreurs serveur
    if (homeRes.status >= 500) {
      serverErrors.add(1);
    }

    // Temps de pause plus réaliste avec variation aléatoire
    sleep(randomIntBetween(1, 3));
  });

  group("02_ProductsPage", function () {
    const productsRes = http.get(`${BASE_URL}/products`, {
      tags: tagRequest(`${BASE_URL}/products`),
    });
    check(productsRes, {
      "Products page loaded successfully": (r) => r.status === 200,
      "Products page contains products": (r) =>
        r.body.includes("téléphone") ||
        r.body.includes("Téléphone") ||
        r.body.includes("phone"),
    });
    pageLoadedRate.add(productsRes.status === 200);

    sleep(randomIntBetween(1, 2));
  });

  // Sélection aléatoire d'un produit
  const randomProduct =
    PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];

  group("03_ProductDetailPage", function () {
    const start = new Date();
    const productRes = http.get(`${BASE_URL}/products/${randomProduct}`, {
      tags: {
        ...tagRequest(`${BASE_URL}/products/${randomProduct}`),
        productId: randomProduct,
      },
    });
    const loadTime = new Date() - start;

    check(productRes, {
      "Product detail page loaded": (r) => r.status === 200,
      "Product detail page has correct product": (r) =>
        r.body.includes(randomProduct),
    });

    productLoadTime.add(loadTime);
    pageLoadedRate.add(productRes.status === 200);

    sleep(randomIntBetween(2, 4));
  });

  // Comportement réaliste: 30% de chance d'ajouter au panier
  if (Math.random() < 0.3) {
    group("04_AddToCart", function () {
      const payload = JSON.stringify({
        productId: randomProduct,
        quantity: 1,
        sessionId: sessionId,
      });

      const headers = {
        "Content-Type": "application/json",
        "X-Test-ID": sessionId,
      };

      const cartRes = http.post(`${BASE_URL}/api/cart/add`, payload, {
        headers,
        tags: { action: "addToCart", productId: randomProduct },
      });

      check(cartRes, {
        "Add to cart successful": (r) => r.status >= 200 && r.status < 300,
      });

      if (cartRes.status >= 200 && cartRes.status < 300) {
        addToCartCount.add(1);
      }

      sleep(1);
    });

    group("05_ViewCart", function () {
      const cartPageRes = http.get(`${BASE_URL}/cart`, {
        tags: tagRequest(`${BASE_URL}/cart`),
      });

      check(cartPageRes, {
        "Cart page loaded successfully": (r) => r.status === 200,
        "Cart page contains products": (r) =>
          r.body.includes("panier") || r.body.includes("cart"),
      });

      pageLoadedRate.add(cartPageRes.status === 200);
      sleep(randomIntBetween(1, 3));
    });

    // 20% de chance de procéder au paiement
    if (Math.random() < 0.2) {
      group("06_Checkout", function () {
        checkoutAttempts.add(1);

        const checkoutRes = http.get(`${BASE_URL}/checkout`, {
          tags: tagRequest(`${BASE_URL}/checkout`),
        });

        check(checkoutRes, {
          "Checkout page loaded successfully": (r) => r.status === 200,
        });

        pageLoadedRate.add(checkoutRes.status === 200);
        sleep(randomIntBetween(2, 4));
      });
    }
  }

  // Attente entre les sessions
  sleep(randomIntBetween(1, 3));

  // Réduire le nombre d'utilisateurs actifs
  activeUsers.add(-1);
}

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    stdout: "Test completed successfully!",
  };
}
