'use client';

import { useEffect, useState } from 'react';
import { hasConsent, setConsent } from '@/lib/analytics';

export function GdprBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!hasConsent());
  }, []);

  if (!show) return null;

  const accept = () => {
    setConsent(true);
    setShow(false);
  };
  const decline = () => {
    setConsent(false);
    setShow(false);
  };

  return (
    <div className="gdpr-banner" role="dialog" aria-label="Cookie consent">
      <p>
        We use cookies to understand how Metrics is used. See our{' '}
        <a href="/privacy" style={{ color: 'var(--accent)' }}>
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="/cookies" style={{ color: 'var(--accent)' }}>
          Cookie Policy
        </a>
        .
      </p>
      <button className="btn-ghost" onClick={decline}>
        Decline
      </button>
      <button className="btn-primary" onClick={accept}>
        Accept
      </button>
    </div>
  );
}
