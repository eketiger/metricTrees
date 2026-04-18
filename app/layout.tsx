import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { GdprBanner } from './components/GdprBanner';
import { AnalyticsProvider } from './components/AnalyticsProvider';

export const metadata: Metadata = {
  title: 'Metrics — Build metric trees that map goals to KPIs',
  description:
    'Metrics is a platform for creating, visualizing, and sharing metric trees. Connect warehouse data, run experiments, and align teams around the numbers that matter.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reactflow@11.11.4/dist/style.css" />
      </head>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
        <GdprBanner />
      </body>
    </html>
  );
}
