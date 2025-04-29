"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/auth";
import { getUserOrders } from "@/lib/firebase/firestore";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/login?redirect=/account/orders");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const userOrders = await getUserOrders(user.uid);
        console.log("Fetched orders:", userOrders);
        setOrders(userOrders);
        setError(null);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Impossible de charger vos commandes");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading, router]);

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (authLoading || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Mes commandes</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-32 h-6" />
                <Skeleton className="w-48 h-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full h-4 mb-2" />
                <Skeleton className="w-3/4 h-4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="w-32 h-10" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-16 mx-auto text-center">
        <div className="max-w-md mx-auto">
          <h1 className="mb-2 text-2xl font-bold">Erreur</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container px-4 py-16 mx-auto text-center">
        <div className="max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Aucune commande</h1>
          <p className="mb-6 text-muted-foreground">
            Vous n'avez pas encore passé de commande
          </p>
          <Button asChild>
            <Link href="/products">Découvrir nos produits</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Mes commandes</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Commande {order.orderNumber || order.id?.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    Passée le{" "}
                    {formatDate(
                      order.createdAt instanceof Date
                        ? order.createdAt
                        : order.createdAt.toDate()
                    )}
                  </CardDescription>
                </div>
                <Badge
                  variant={order.status === "delivered" ? "default" : "outline"}
                  className="flex items-center gap-1.5"
                >
                  <Package className="h-3.5 w-3.5" />
                  {order.status === "paid" && "Payée"}
                  {order.status === "processing" && "En traitement"}
                  {order.status === "shipped" && "Expédiée"}
                  {order.status === "delivered" && "Livrée"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  {order.items.length} article
                  {order.items.length > 1 ? "s" : ""}
                </p>
                <p className="font-medium">Total: {formatPrice(order.total)}</p>
                {order.phone && (
                  <p className="text-sm text-muted-foreground">
                    Tél: {order.phone}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href={`/account/orders/${order.id}`}>
                  Détails de la commande
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
