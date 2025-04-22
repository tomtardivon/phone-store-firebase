"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useCart } from "@/components/cart-provider"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"

interface AnimatedProductCardProps {
  product: Product
  index: number
}

export default function AnimatedProductCard({ product, index }: AnimatedProductCardProps) {
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleAddToCart = () => {
    addItem(product)
    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à votre panier`,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <Link href={`/products/${product.id}`}>
          <motion.div
            className="aspect-square relative overflow-hidden bg-muted"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </motion.div>
        </Link>
        <CardContent className="p-4 flex-grow">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-medium text-lg truncate">{product.name}</h3>
          </Link>
          <p className="text-muted-foreground text-sm truncate">{product.description}</p>
          <p className="mt-2 font-semibold">{product.price.toFixed(2)} €</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <motion.div className="w-full" whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddToCart} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ajouter au panier
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
