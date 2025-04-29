"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/firebase/auth";
import { getOrderById } from "@/lib/firebase/firestore";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=/account/orders/${orderId}`);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);

        if (!orderData) {
          setError("Commande non trouvée");
          return;
        }

        // Vérifier que la commande appartient à l'utilisateur connecté
        if (orderData.userId !== user.uid) {
          setError("Vous n'avez pas accès à cette commande");
          return;
        }

        setOrder(orderData);
        setError(null);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Impossible de charger les détails de la commande");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, authLoading, router, orderId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "processing":
        return "secondary";
      case "shipped":
        return "outline";
      case "delivered":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <Package className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Payée";
      case "processing":
        return "En traitement";
      case "shipped":
        return "Expédiée";
      case "delivered":
        return "Livrée";
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-48 h-8" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="w-64 h-6" />
            <Skeleton className="w-48 h-4" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="w-full h-32" />
              <Skeleton className="w-full h-32" />
            </div>
            <Skeleton className="w-full h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-16 mx-auto text-center">
        <div className="max-w-md mx-auto">
          <h1 className="mb-2 text-2xl font-bold">Erreur</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/account/orders")}
          >
            Retour aux commandes
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/account/orders")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux commandes
        </Button>
        <h1 className="text-2xl font-bold">Détails de la commande</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">
                Commande #{order.id?.substring(0, 8)}
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
              variant={getStatusBadgeVariant(order.status)}
              className="flex items-center gap-1 w-fit"
            >
              {getStatusIcon(order.status)}
              {getStatusText(order.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Informations de la commande */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Informations de paiement</h3>
              <p className="text-sm text-muted-foreground">
                ID de paiement: {order.paymentId?.substring(0, 12)}...
              </p>
              <p className="text-sm text-muted-foreground">
                Méthode: Carte bancaire
              </p>
            </div>

            {order.shippingAddress && (
              <div>
                <h3 className="mb-2 font-semibold">Adresse de livraison</h3>
                <p className="text-sm">{order.shippingAddress.name}</p>
                <p className="text-sm">{order.shippingAddress.address}</p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-sm">
                    {order.shippingAddress.addressLine2}
                  </p>
                )}
                <p className="text-sm">
                  {order.shippingAddress.postalCode}{" "}
                  {order.shippingAddress.city}
                </p>
                <p className="text-sm">{order.shippingAddress.country}</p>
                {order.phone && (
                  <p className="mt-2 text-sm">Tél: {order.phone}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Articles de la commande */}
          <div>
            <h3 className="mb-4 font-semibold">Articles commandés</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <div className="relative flex-shrink-0 w-20 h-20">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm truncate text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm">Quantité: {item.quantity}</p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-sm">
                        {item.price.toFixed(2)} € l'unité
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {(item.price * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Résumé */}
          <div>
            <h3 className="mb-4 font-semibold">Résumé</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>Gratuite</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Suivi de la commande */}
          {order.status !== "delivered" && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 font-semibold">Suivi de la commande</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Commande confirmée</p>
                      <p className="text-sm text-muted-foreground">
                        Votre commande a été confirmée et payée
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        ["processing", "shipped", "delivered"].includes(
                          order.status
                        )
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">En préparation</p>
                      <p className="text-sm text-muted-foreground">
                        Votre commande est en cours de préparation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        ["shipped", "delivered"].includes(order.status)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Expédiée</p>
                      <p className="text-sm text-muted-foreground">
                        Votre commande a été expédiée
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
