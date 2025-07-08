'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import AppLayout from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SORE-V2",
  description: "Una nuova avventura insieme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <NextAuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </NextAuthProvider>
      </body>
    </html>
  );
} 