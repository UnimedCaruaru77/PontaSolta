import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PONTA SOLTA - Controle de Demandas & Gestão de Projetos",
  description: "Sistema de gestão de demandas e projetos com tecnologia avançada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
