"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";
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

  const userId = params.userId as string;
  const orderId = params.id as string;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/auth/login?redirect=/account/orders/${userId}/${orderId}`);
      return;
    }

    // Vérifier que l'utilisateur ne tente pas d'accéder aux commandes d'un autre utilisateur
    if (user.uid !== userId) {
      setError("Vous n'avez pas accès à cette commande");
      setLoading(false);
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
  }, [user, authLoading, router, userId, orderId]);

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: order?.currency || "EUR",
    }).format(price);
  };

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

  // Identifier le numéro de commande à afficher
  const displayOrderNumber =
    order.orderNumber || `#${order.id?.substring(0, 8)}`;

  // Convertir les dates si nécessaire
  const orderDate =
    order.createdAt instanceof Date
      ? order.createdAt
      : order.createdAt.toDate();

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
                Commande {displayOrderNumber}
              </CardTitle>
              <CardDescription>
                Passée le {formatDate(orderDate)}
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
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">Informations de paiement</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  ID de paiement:
                  <span className="font-mono text-foreground">
                    {order.paymentId?.substring(0, 12)}...
                  </span>
                </p>
                {order.paymentMethod && (
                  <p className="text-muted-foreground">
                    Méthode:{" "}
                    {order.paymentMethod === "card"
                      ? "Carte bancaire"
                      : order.paymentMethod}
                  </p>
                )}
              </div>
            </div>

            {/* Informations de contact */}
            <div>
              <h3 className="mb-3 font-semibold">Informations de contact</h3>
              <div className="space-y-2">
                {order.email && (
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {order.email}
                  </p>
                )}
                {order.phone && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {order.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Adresses */}
          <div className="grid gap-6 md:grid-cols-2">
            {order.shippingAddress && (
              <div>
                <h3 className="mb-3 font-semibold">Adresse de livraison</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.address}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.postalCode}{" "}
                    {order.shippingAddress.city}
                    {order.shippingAddress.state &&
                      `, ${order.shippingAddress.state}`}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            )}

            {order.billingAddress && (
              <div>
                <h3 className="mb-3 font-semibold">Adresse de facturation</h3>
                <div className="space-y-1 text-sm">
                  <p>{order.billingAddress.address}</p>
                  {order.billingAddress.addressLine2 && (
                    <p>{order.billingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.billingAddress.postalCode}{" "}
                    {order.billingAddress.city}
                    {order.billingAddress.state &&
                      `, ${order.billingAddress.state}`}
                  </p>
                  <p>{order.billingAddress.country}</p>
                </div>
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
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm truncate text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm">Quantité: {item.quantity}</p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-sm">
                        {formatPrice(item.price)} l'unité
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
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
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>Gratuite</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
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
