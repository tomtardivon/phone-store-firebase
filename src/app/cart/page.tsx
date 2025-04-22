"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, ArrowRight, ShoppingCart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/firebase/auth"
import { Input } from "@/components/ui/input"
import { createCheckoutSession } from "@/lib/stripe/checkout"
import { useToast } from "@/hooks/use-toast"
import { PageTransition } from "@/components/motion/page-transition"

export default function CartPage() {
  const { items, removeItem, updateItemQuantity, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const subtotal = items.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 1) return
    updateItemQuantity(id, quantity)
  }

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour finaliser votre achat",
      })
      router.push("/auth/login?redirect=/cart")
      return
    }

    try {
      setIsLoading(true)
      const sessionUrl = await createCheckoutSession(items, user.uid)
      router.push(sessionUrl)
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast({
        title: "Erreur",
        description: "Impossible de procéder au paiement",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">Votre panier est vide</h1>
              <p className="text-muted-foreground mb-6">Découvrez nos produits et ajoutez-les à votre panier</p>
              <Button asChild>
                <Link href="/products">Voir les produits</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Votre panier</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="border rounded-lg overflow-hidden">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-b last:border-b-0"
                  >
                    <div className="p-4 flex gap-4">
                      <div className="w-20 h-20 relative flex-shrink-0 bg-muted rounded">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 truncate">{item.description}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value) || 1)}
                              className="h-8 w-12 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <motion.div whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(item.price * item.quantity).toFixed(2)} €</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {item.price.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>Gratuite</span>
                </div>
                <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
                  <span>Total</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button onClick={handleCheckout} className="w-full mb-2" disabled={isLoading}>
                  {isLoading ? "Chargement..." : "Procéder au paiement"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </motion.div>
              <Button variant="outline" className="w-full" onClick={() => router.push("/products")}>
                Continuer mes achats
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
