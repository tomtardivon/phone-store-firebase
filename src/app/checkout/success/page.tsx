"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/lib/hooks/use-cart";
import { useAuth } from "@/lib/firebase/auth";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const userId = searchParams.get("user_id");
  const router = useRouter();
  const { clearCart } = useCart();
  const { user, loading } = useAuth();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Vider le panier une fois seulement
    if (sessionId && !isClearing) {
      setIsClearing(true);
      clearCart();
    }
  }, [sessionId, clearCart, isClearing]);

  // Rediriger si pas de session ID
  useEffect(() => {
    if (!sessionId) {
      router.push("/");
    }
  }, [sessionId, router]);

  // Construire la route vers les commandes en fonction du userId
  const getOrdersRoute = () => {
    // Si on a un userId dans les paramètres, l'utiliser
    if (userId) {
      return `/account/orders`;
    }

    // Sinon, utiliser l'ID de l'utilisateur connecté
    if (user) {
      return `/account/orders`;
    }

    // Si pas d'utilisateur, rediriger vers la page d'accueil
    return "/";
  };

  return (
    <div className="container flex justify-center px-4 py-16 mx-auto">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Paiement réussi</CardTitle>
          <CardDescription>
            Merci pour votre achat ! Votre commande a été confirmée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Un email de confirmation vous a été envoyé. Votre commande est en
              cours de traitement.
            </p>
            {sessionId && (
              <p className="text-sm text-center">
                Numéro de transaction : {sessionId.substring(0, 8)}...
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={() => router.push(getOrdersRoute())}
            className="w-full"
          >
            Voir mes commandes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
