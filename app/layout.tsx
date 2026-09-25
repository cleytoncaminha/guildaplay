import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { TornPaperFilters } from "@/components/torn-paper-filters";
import "./globals.css";
import "./public-pages.css";
import "./auth.css";
import "./personal.css";
import "./contributions.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Dados da Guilda | Seu próximo mundo começa aqui",
  description: "Explore sistemas, aventuras e suplementos para a sua próxima campanha.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${sans.variable}`}>
        <TornPaperFilters />
        {children}
      </body>
    </html>
  );
}
