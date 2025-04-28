import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SocketInitializer } from "@/components/SocketInitializer";
import ErrorToastWrapper from '@/components/ErrorToast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Live Chat Support",
  description: "Real-time chat support system for visitors and agents",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Live Chat Support",
    description: "Real-time chat support system for visitors and agents",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Live Chat Support Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Chat Support",
    description: "Real-time chat support system for visitors and agents",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketInitializer />
        {children}
        <ErrorToastWrapper />
      </body>
    </html>
  );
}
