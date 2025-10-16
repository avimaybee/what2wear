import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What2Wear - AI-Powered Outfit Recommendations",
  description: "Context-aware, highly personalized daily outfit decision engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
