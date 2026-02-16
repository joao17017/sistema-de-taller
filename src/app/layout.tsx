import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "./whatsapp-button";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { CurrencyProvider } from "@/components/providers/currency-provider";

export const metadata: Metadata = {
  title: "Sistema de Taller",
  description: "Gestión de órdenes de servicio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <CurrencyProvider>
            {children}
            <WhatsAppButton />
          </CurrencyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
