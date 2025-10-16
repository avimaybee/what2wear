import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Playwrite_DE_Grund } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import BottomNav from "./components/BottomNav";
import { cn } from "@/lib/utils";

const fontSans = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontSerif = Playwrite_DE_Grund({
  variable: "--font-serif",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "setmyfit",
  description: "Your personal AI stylist",
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
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontSerif.variable
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
        </Providers>
      </body>
    </html>
  );
}
