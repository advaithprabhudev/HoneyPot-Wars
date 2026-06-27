import type { Metadata } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css';
import { PixelatedCanvas } from '@/components/ui/pixel-cursor';

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Honeypot Wars — Coverage Assurance for the Fraud-Defence Generation',
  description:
    'Honeypot Wars stress-tests your fraud defences against novel attack patterns and tells you exactly where your coverage fails.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body>
        {children}
        {/* Site-wide pixel cursor overlay. pointer-events:none so it never blocks clicks. */}
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
          <PixelatedCanvas />
        </div>
      </body>
    </html>
  );
}
