"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
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
        console.log("Fetched orders:", userOrders); // Debug log
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

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mes commandes</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Erreur</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Aucune commande</h1>
          <p className="text-muted-foreground mb-6">
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes commandes</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Commande #{order.id?.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    Passée le {formatDate(order.createdAt)}
                  </CardDescription>
                </div>
                <Badge
                  variant={order.status === "delivered" ? "default" : "outline"}
                >
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
                <p className="font-medium">Total: {order.total.toFixed(2)} €</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href={`/account/orders/${order.id}`}>
                  Détails de la commande
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
