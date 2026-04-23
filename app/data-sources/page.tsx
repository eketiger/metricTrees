'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DataSourcesModal } from '@/app/components/DataSourcesModal';

export default function DataSourcesPage() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="home-topbar">
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark" />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Metrics</div>
        </div>
        <Link href="/home" className="tb-btn">← Back to workspace</Link>
        <div style={{ flex: 1 }} />
      </header>
      {open && <DataSourcesModal onClose={() => { setOpen(false); window.location.href = '/home'; }} />}
    </div>
  );
}
