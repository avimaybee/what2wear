import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Playwrite_DE_Grund } from "next/font/google";
import { Header } from "@/components/ui/header";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans_Condensed({
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["sans-serif"],
});

const playwrite = Playwrite_DE_Grund({
  weight: ["100", "200", "300", "400"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  fallback: ["serif"],
});

export const metadata: Metadata = {
  title: "setmyfit - AI-Powered Outfit Recommendations",
  description: "Context-aware, highly personalized daily outfit decision engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${ibmPlexSans.variable} ${playwrite.variable}`}>
      <body>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
