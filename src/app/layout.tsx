import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { FooterExtrasProvider } from "@/components/layout/footer-extras";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { APP_NAME, DEFAULT_APP_URL } from "@/lib/constants";
import "./globals.css";

const siteDescription =
  "Plataforma de reservas y landing page para barberías. Agenda online, multi-barbero y panel de control.";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${APP_NAME} — Reservas para barberías`,
    template: `%s | ${APP_NAME}`,
  },
  description: siteDescription,
  applicationName: APP_NAME,
  keywords: [
    "barbería",
    "barber shop",
    "reservas online",
    "citas barbería",
    "MiBarbería",
    "mibarberia",
    "Honduras",
    "agenda barberos",
  ],
  authors: [{ name: APP_NAME, url: appUrl }],
  creator: APP_NAME,
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_HN",
    url: appUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — Reservas para barberías`,
    description: siteDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Reservas para barberías`,
    description: siteDescription,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { color: "#c9a227" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${dmSans.variable} h-full dark`}>
      <body className="flex min-h-dvh flex-col bg-brand-black text-brand-text antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>
            <FooterExtrasProvider>
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              <SiteFooter />
            </FooterExtrasProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
