import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OFF24 Preventivatore",
  description: "Sistema di preventivazione per carpenteria metallica — Officina24 Srl",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
