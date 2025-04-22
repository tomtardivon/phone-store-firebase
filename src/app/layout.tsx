import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { CartProvider } from "@/components/cart-provider"
import { QueryProvider } from "@/lib/providers/query-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    template: "%s | TéléStore",
    default: "TéléStore - Achetez votre smartphone",
  },
  description: "Boutique en ligne de smartphones haut de gamme aux meilleurs prix",
  keywords: ["smartphone", "téléphone", "boutique", "e-commerce", "mobile"],
  authors: [{ name: "TéléStore Team" }],
  creator: "TéléStore",
  publisher: "TéléStore",
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <AuthProvider>
              <CartProvider>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <footer className="border-t py-6">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                      © {new Date().getFullYear()} TéléStore. Tous droits réservés.
                    </div>
                  </footer>
                </div>
                <Toaster />
              </CartProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
