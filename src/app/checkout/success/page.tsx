"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/firebase/auth"
import { saveOrder } from "@/lib/firebase/firestore"
import { useCart } from "@/lib/hooks/use-cart"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { items, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processOrder = async () => {
      if (!sessionId || !user) {
        setIsProcessing(false)
        return
      }

      try {
        // Enregistrer la commande dans Firebase
        await saveOrder({
          userId: user.uid,
          items: items,
          total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          status: "paid",
          paymentId: sessionId,
          createdAt: new Date(),
        })

        // Vider le panier après commande réussie
        clearCart()

        toast({
          title: "Commande confirmée",
          description: "Votre commande a été enregistrée avec succès",
        })
      } catch (error) {
        console.error("Error processing order:", error)
        toast({
          title: "Erreur",
          description: "Un problème est survenu lors de l'enregistrement de votre commande",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }

    processOrder()
  }, [sessionId, user, items, clearCart, toast])

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-2xl">Paiement réussi</CardTitle>
          <CardDescription>Merci pour votre achat ! Votre commande a été confirmée.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Un email de confirmation a été envoyé à votre adresse email.
            </p>
            {isProcessing && <p className="text-center text-sm">Traitement de votre commande en cours...</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={() => router.push("/account/orders")} className="w-full">
            Voir mes commandes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Retour à l'accueil
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
