import type { Metadata } from 'next';
import '@/styles/semantic.css';
import '@/styles/brand-base509.css';
import '@/styles/brand-petappro.css';

export const metadata: Metadata = {
  title: 'Base509',
  description: 'Base509 LLC — an app development company building software people can trust.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
