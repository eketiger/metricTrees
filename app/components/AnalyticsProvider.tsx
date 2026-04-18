'use client';

import { useEffect, type ReactNode } from 'react';
import { initAnalytics, track, hasConsent } from '@/lib/analytics';
import { usePathname } from 'next/navigation';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (hasConsent()) initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    track('Page Viewed', {
      page: document.title,
      path: pathname,
      referrer: document.referrer,
    });
  }, [pathname]);

  return <>{children}</>;
}
