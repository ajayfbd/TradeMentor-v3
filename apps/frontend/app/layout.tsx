import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from '@/components/ui/toaster';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { ProductionProviders } from '@/components/production/ProductionProviders';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TradeMentor - Emotion Trading Journal',
  description: 'Track your trading emotions and improve performance with AI-powered insights',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  keywords: ['trading', 'emotions', 'journal', 'psychology', 'performance'],
  authors: [{ name: 'TradeMentor' }],
  creator: 'TradeMentor',
  publisher: 'TradeMentor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4338CA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ProductionProviders>
          <QueryProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </QueryProvider>
        </ProductionProviders>
      </body>
    </html>
  );
}
