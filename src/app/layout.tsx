import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Anonify — anonymous messages, filtered on arrival',
    template: '%s · Anonify',
  },
  description:
    'Share one link and let anyone write to you anonymously. A trained filter blocks abusive notes before they reach your inbox.',
  openGraph: {
    title: 'Anonify — anonymous messages, filtered on arrival',
    description:
      'Share one link and let anyone write to you anonymously. Abusive notes are blocked before delivery.',
    siteName: 'Anonify',
    type: 'website',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" >
      <AuthProvider>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </AuthProvider>
    </html>
  );
}

