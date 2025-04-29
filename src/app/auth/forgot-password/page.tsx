"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { getAuth } from "@/lib/firebase/auth";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, InfoIcon } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, values.email, {
        url: `${window.location.origin}/auth/login`, // URL de redirection après réinitialisation
      });

      setSuccess(true);

      toast({
        title: "Email envoyé",
        description:
          "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage = "Impossible d'envoyer l'email de réinitialisation";

      // Messages d'erreur spécifiques
      if (error.code === "auth/user-not-found") {
        // Pour des raisons de sécurité, ne pas indiquer si l'utilisateur existe ou non
        setSuccess(true); // Simuler le succès même si l'email n'existe pas
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Trop de tentatives. Veuillez réessayer plus tard";
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-600">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertTitle>Email envoyé</AlertTitle>
              <AlertDescription>
                Si un compte existe avec cette adresse email, vous recevrez un
                lien de réinitialisation dans les prochaines minutes. Vérifiez
                votre boîte de réception et vos spams.
              </AlertDescription>
            </Alert>

            <Alert variant="default" className="mt-4">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Le lien sera valide pendant 1 heure. Si vous ne recevez pas
                l'email, vérifiez votre dossier spam ou essayez à nouveau.
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="exemple@email.com"
                          type="email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Un email contenant les instructions de réinitialisation de
                    mot de passe vous sera envoyé si l'adresse est associée à un
                    compte.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien de réinitialisation"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        )}

        {success && (
          <CardFooter>
            <div className="w-full">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/login">Retour à la connexion</Link>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
