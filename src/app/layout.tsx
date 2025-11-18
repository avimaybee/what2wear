import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { Header } from "@/components/ui/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "setmyfit - AI-Powered Outfit Recommendations",
  description: "Get personalized outfit recommendations based on weather and your wardrobe",
};

const bodyFont = Fredoka({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-body" });
const headingFont = {
  style: {
    fontFamily: '"Stack Sans Text", sans-serif',
  },
  variable: "--font-heading",
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
      className={`${bodyFont.variable}`}
      style={{
        ['--font-heading' as string]: '"Stack Sans Text", sans-serif',
      }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Stack+Sans+Text:wght@200..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-[family-name:var(--font-body)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1" role="main">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
