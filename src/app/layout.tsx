import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  openGraph: {
    title: "MakanGuys — Makan Guys, Meninggal kalian kalo gak makan",
    description: "Temukan yang enak, tandai tempatnya. Rekomendasi kuliner langsung dari komunitas.",
    type: "website",
    locale: "id_ID",
    images: ['/brand.png'],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
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
      </body>
    </html>
  );
}
