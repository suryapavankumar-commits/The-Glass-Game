import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/store/gameStore';

export const metadata: Metadata = {
  title: 'The Glass Game — An AI That Watches Itself Fail',
  description:
    'An interactive narrative game powered by an AI Game Master — with a second intelligence watching the trace, detecting context drift, and repairing failures before the story breaks.',
  keywords: ['AI game', 'context engineering', 'LLM observability', 'Glass Box', 'context surgeon'],
  openGraph: {
    title: 'The Glass Game',
    description: 'A game that can watch itself fail — and heal itself.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
