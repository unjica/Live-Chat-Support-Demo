import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SocketInitializer } from "@/components/SocketInitializer";
import ErrorToastWrapper from '@/components/ErrorToast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Live Chat Support",
  description: "Real-time chat support system for visitors and agents",
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
