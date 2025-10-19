import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Header } from "@/components/ui/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SquircleProvider } from "@/components/ui/squircle-filter";
import { FirstVisitStairs } from "@/components/client/first-visit-stairs";
import "./globals.css";

export const metadata: Metadata = {
  title: "setmyfit - AI-Powered Outfit Recommendations",
  description: "Context-aware, highly personalized daily outfit decision engine that helps you dress perfectly for any occasion",
  keywords: ["outfit recommendations", "AI fashion", "wardrobe assistant", "weather-based outfits"],
  authors: [{ name: "setmyfit" }],
  creator: "setmyfit",
  metadataBase: new URL("https://setmyfit.com"),
  openGraph: {
    title: "setmyfit - AI-Powered Outfit Recommendations",
    description: "Context-aware, highly personalized daily outfit decision engine",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirstVisitStairs>
            <SquircleProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <Toaster />
            </SquircleProvider>
          </FirstVisitStairs>
        </ThemeProvider>
      </body>
    </html>
  );
}
