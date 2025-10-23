import type { Metadata } from "next";
import "./globals.css";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

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
        <AuthenticatedLayout>
          {children}
        </AuthenticatedLayout>
      </body>
    </html>
  );
}
