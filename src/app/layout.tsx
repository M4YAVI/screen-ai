import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cluely 2026 - Invisible Desktop Intelligence",
  description: "AI-powered desktop assistant with real-time insights",
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
