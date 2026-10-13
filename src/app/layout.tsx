import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import './globals.css';

const liebling = localFont({
  src: [
    { path: './fonts/Liebling-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/Liebling-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/Liebling-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-liebling',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Backoffice MAS',
    template: '%s — Backoffice MAS',
  },
  description: 'Gestión de afiliaciones de Mutual Argentina Solidaria.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#3d3d3b',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={liebling.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
