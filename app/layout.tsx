import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jackie Jeans — Find Your Perfect Fit",
  description: "Answer a few questions and we'll find jeans that actually fit you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0D0D0F] text-[#F5F0E8]">
        {children}
      </body>
    </html>
  );
}
