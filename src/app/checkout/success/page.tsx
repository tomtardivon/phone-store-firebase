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

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();
  const { clearCart } = useCart();
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

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
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
              <p className="text-center text-sm">
                Numéro de session : {sessionId.substring(0, 8)}...
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={() => router.push("/account/orders")}
            className="w-full"
          >
            Voir mes commandes
            <ArrowRight className="ml-2 h-4 w-4" />
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
