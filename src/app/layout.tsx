import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "./components/PageTransition";

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
      <body className="antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}