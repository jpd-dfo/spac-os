import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'SPAC OS - Deal Management Platform',
    template: '%s | SPAC OS',
  },
  description: 'Comprehensive SPAC deal management and compliance platform',
  keywords: ['SPAC', 'deal management', 'compliance', 'SEC filings', 'de-SPAC'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen bg-gray-50 font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
