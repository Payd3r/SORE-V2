'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AnimatePresence, domAnimation, LazyMotion, motion } from 'framer-motion';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import CustomInstallPrompt from '@/components/PWA/CustomInstallPrompt';
import GestureNavigator from '@/components/PWA/GestureNavigator';
import OfflineIndicator from '@/components/PWA/OfflineIndicator';
import SplashScreen from '@/components/PWA/SplashScreen';
import Providers from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import UploadProgress from '@/components/UploadProgress';
import KeyboardAwareView from '@/components/utils/KeyboardAwareView';
import { cn } from '@/lib/utils';
import './globals.css';
import '@/styles/mobile.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <title>SORE - Ricordi Condivisi</title>
        <meta
          name="description"
          content="Cattura e condividi ricordi speciali con il tuo partner. Un'app PWA per coppie che vogliono conservare i loro momenti più belli."
        />
        <meta
          name="keywords"
          content="ricordi di coppia, album fotografico condiviso, diario di coppia, timeline amore, momenti speciali, app per coppie, storia d'amore digitale, PWA per amore, SORE app"
        />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        {/* ... other meta tags ... */}
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <LazyMotion features={domAnimation}>
              {loading ? (
                <SplashScreen />
              ) : (
                <KeyboardAwareView>
                  <GestureNavigator>
                    <OfflineIndicator />
                    <Header />
                    <AnimatePresence mode="wait">
                      <motion.main
                        key={pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="min-h-[calc(100vh-var(--header-height)-var(--bottom-nav-height))]"
                      >
                        {children}
                      </motion.main>
                    </AnimatePresence>
                    <UploadProgress />
                    <CustomInstallPrompt />
                  </GestureNavigator>
                </KeyboardAwareView>
              )}
            </LazyMotion>
            <Toaster />
          </Providers>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
} 