'use client';

import { useEffect, useState } from 'react';

interface Sub {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const [sub, setSub] = useState<Sub | null>(null);

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then((r) => r.json())
      .then(setSub)
      .catch(() => setSub({ plan: 'free', status: null, currentPeriodEnd: null, cancelAtPeriodEnd: false }));
  }, []);

  const openPortal = async () => {
    const res = await fetch('/api/billing/create-portal-session', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <main className="prose-wrap">
      <h1>Billing</h1>
      {sub ? (
        <>
          <p>
            Current plan: <strong>{sub.plan}</strong>
            {sub.status ? ` (${sub.status})` : ''}
          </p>
          {sub.currentPeriodEnd && (
            <p>Next billing date: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
          )}
          {sub.cancelAtPeriodEnd && <p>Your subscription will cancel at the end of the period.</p>}
          <button className="btn-primary" onClick={openPortal}>
            Manage billing
          </button>
        </>
      ) : (
        <p>Loading…</p>
      )}
    </main>
  );
}
