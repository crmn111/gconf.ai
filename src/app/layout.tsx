import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { prefetchAppDetails } from '@/lib/prefetch';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const app = await prefetchAppDetails();
  const favicon = app?.favicon;
  return {
    title: app?.app_name || 'gconf.ai',
    description: app?.app_description || 'the conference reimagined',
    ...(favicon
      ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } }
      : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
