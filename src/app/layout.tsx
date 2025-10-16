import type { Metadata } from "next";
import "./globals.css";
import Providers from "./components/Providers";
import BottomNav from "./components/BottomNav";
import { cn } from "@/lib/utils";

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
        </Providers>
      </body>
    </html>
  );
}
