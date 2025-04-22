"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useProduct } from "@/lib/hooks/use-products"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition } from "@/components/motion/page-transition"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()

  const productId = typeof params.id === "string" ? params.id : ""
  const { data: product, isLoading, error } = useProduct(productId)

  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du produit",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product)
    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à votre panier`,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
          <div className="md:w-1/2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <Button onClick={() => router.back()} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          <motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full"
              >
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-semibold mb-4">{product.price.toFixed(2)} €</p>
            <div className="prose mb-6">
              <p>{product.description}</p>
              <ul className="mt-4">
                {product.features?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button onClick={handleAddToCart} size="lg" className="w-full md:w-auto">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ajouter au panier
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
