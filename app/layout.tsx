import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),

  title: {
    default: "GameCentral | Gamer Pazarı",
    template: "%s | GameCentral",
  },

  description:
    "Oyuncu ekipmanları, gaming ürünleri, dijital ürünler ve ikinci el oyuncu pazarı için GameCentral beta marketplace platformu.",

  keywords: [
    "GameCentral",
    "gamer pazarı",
    "oyuncu ekipmanları",
    "oyuncu koltuğu",
    "oyuncu masası",
    "gaming mouse",
    "gaming klavye",
    "gaming kulaklık",
    "monster laptop",
    "valorant vp",
    "metin2 market",
    "ikinci el oyuncu ekipmanları",
  ],

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "GameCentral | Gamer Pazarı",
    description:
      "Oyuncular için ilan, ekipman, dijital ürün ve beta marketplace altyapısı.",
    url: env.siteUrl,
    siteName: "GameCentral",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GameCentral",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "GameCentral | Gamer Pazarı",
    description:
      "Oyuncular için ilan, ekipman, dijital ürün ve beta marketplace altyapısı.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <Header />
        {children}
        <Footer />
        <FloatingSupport />
      </body>
    </html>
  );
}