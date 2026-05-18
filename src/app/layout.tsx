import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MiBarbería — Reservas para barberías",
    template: "%s | MiBarbería",
  },
  description:
    "Plataforma de reservas y landing page para barberías. Agenda online, multi-barbero y panel de control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-brand-black text-brand-text antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
