import type { Metadata } from "next";
import "./globals.css";
import Providers from "./components/Providers";
import BottomNav from "./components/BottomNav";
import ScrollToTop from "./components/ScrollToTop";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "setmyfit - Your Personal AI Stylist",
    template: "%s | setmyfit"
  },
  description: "Transform your wardrobe with AI-powered outfit recommendations. Organize, create, and discover your perfect style.",
  keywords: ["wardrobe", "outfit", "AI stylist", "fashion", "clothing", "style"],
  authors: [{ name: "setmyfit" }],
  creator: "setmyfit",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://setmyfit.vercel.app",
    title: "setmyfit - Your Personal AI Stylist",
    description: "Transform your wardrobe with AI-powered outfit recommendations.",
    siteName: "setmyfit",
  },
  twitter: {
    card: "summary_large_image",
    title: "setmyfit - Your Personal AI Stylist",
    description: "Transform your wardrobe with AI-powered outfit recommendations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
          <BottomNav />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
