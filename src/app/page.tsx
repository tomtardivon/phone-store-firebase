"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/motion/page-transition"
import AnimatedProductCard from "@/components/motion/animated-product-card"
import { usePopularProducts } from "@/lib/hooks/use-products"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const { data: popularProducts, isLoading, error } = usePopularProducts(4)

  // Rendu des cartes de produits avec état de chargement
  const renderProductCards = () => {
    if (isLoading) {
      return Array(4)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))
    }

    if (error || !popularProducts) {
      return (
        <div className="col-span-full text-center py-8">
          <p className="text-red-500">Impossible de charger les produits</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/products">Voir tous les produits</Link>
          </Button>
        </div>
      )
    }

    return popularProducts.map((product, index) => (
      <AnimatedProductCard key={product.id} product={product} index={index} />
    ))
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-center mb-6">TéléStore</h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Découvrez notre sélection de smartphones haut de gamme aux meilleurs prix
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Nos téléphones populaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {renderProductCards()}
          </div>
        </section>

        <section className="bg-muted rounded-lg p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold mb-3">Pourquoi nous choisir ?</h2>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    ✓
                  </div>
                  <span>Livraison gratuite sous 48h</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    ✓
                  </div>
                  <span>Garantie 2 ans sur tous nos produits</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    ✓
                  </div>
                  <span>Service client disponible 7j/7</span>
                </li>
              </ul>
            </div>
            <div>
              <Button asChild size="lg">
                <Link href="/products">Voir tous nos téléphones</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
