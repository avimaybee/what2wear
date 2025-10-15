import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "./components/PageTransition";
import Providers from "./components/Providers";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "what2wear",
  description: "Your personal AI stylist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-text">
        <Providers>
          <div className="min-h-screen pb-[72px] safe-bottom">
            <PageTransition>{children}</PageTransition>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}