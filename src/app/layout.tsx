import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import InstallPwaPrompt from "@/components/pwa/InstallPwaPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "MakanGuys — Temukan yang Enak, Tandai Tempatnya",
  description:
    "Peta kuliner berbasis komunitas Indonesia. Temukan warung makan tersembunyi, jajanan kaki lima legendaris, dan bagikan rekomendasi tempat makan favorit secara mudah tanpa perlu membuat akun.",
  keywords: [
    "kuliner indonesia",
    "peta tempat makan",
    "rekomendasi makanan",
    "warung makan",
    "street food indonesia",
    "makan enak",
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MakanGuys',
  },
  openGraph: {
    title: "MakanGuys — Makan Guys, Meninggal kalian kalo gak makan",
    description: "Temukan yang enak, tandai tempatnya. Rekomendasi kuliner langsung dari komunitas.",
    type: "website",
    locale: "id_ID",
    images: ['/brand.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
        <InstallPwaPrompt />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
