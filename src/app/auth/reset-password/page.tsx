"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { getAuth } from "@/lib/firebase/auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z
      .string()
      .min(6, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Composant qui utilise useSearchParams, déplacé dans un sous-composant
function ResetPasswordForm() {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Importation et utilisation de useSearchParams dans ce composant
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!oobCode) {
        setIsValidToken(false);
        setLoading(false);
        return;
      }

      try {
        setResetCode(oobCode);
        const auth = getAuth();
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setIsValidToken(true);
      } catch (error) {
        console.error("Invalid or expired reset code:", error);
        setIsValidToken(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [oobCode]);

  const onSubmit = async (values: z.infer<typeof resetSchema>) => {
    if (!resetCode) return;

    try {
      setLoading(true);
      const auth = getAuth();
      await confirmPasswordReset(auth, resetCode, values.password);

      // Afficher le message de succès
      setSuccess(true);

      toast({
        title: "Mot de passe réinitialisé",
        description: "Votre mot de passe a été mis à jour avec succès",
      });

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Erreur",
        description: "La réinitialisation du mot de passe a échoué",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !success) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Réinitialisation du mot de passe</CardTitle>
            <CardDescription>Vérification du lien...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken && !success) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lien invalide ou expiré</CardTitle>
            <CardDescription>
              Ce lien de réinitialisation n'est plus valide ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Votre lien de réinitialisation est invalide ou a expiré.
                Veuillez demander un nouveau lien.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mot de passe réinitialisé</CardTitle>
            <CardDescription>
              Votre mot de passe a été modifié avec succès
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>
                Votre mot de passe a été réinitialisé. Vous allez être redirigé
                vers la page de connexion.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réinitialiser votre mot de passe</CardTitle>
          <CardDescription>
            {email
              ? `Pour le compte ${email}`
              : "Choisissez un nouveau mot de passe"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Réinitialisation en cours..."
                  : "Réinitialiser le mot de passe"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

// Composant principal avec Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Réinitialisation du mot de passe</CardTitle>
              <CardDescription>Chargement...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
