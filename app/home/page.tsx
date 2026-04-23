'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface TreeSummary {
  id: string;
  title: string;
  description?: string | null;
  nodeCount: number;
  status: 'draft' | 'published' | 'archived';
  updatedAt: string;
}

export default function HomePage() {
  const [trees, setTrees] = useState<TreeSummary[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/metric-trees')
      .then((r) => (r.ok ? r.json() : { trees: [] }))
      .then((d: { trees?: TreeSummary[] }) => setTrees(d.trees ?? []))
      .catch(() => setTrees([]));
  }, []);

  const filtered = useMemo(
    () => (trees ?? []).filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase())),
    [trees, search],
  );

  const newTree = async () => {
    const res = await fetch('/api/metric-trees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Tree' }),
    });
    if (res.ok) {
      const { tree } = await res.json();
      window.location.href = `/tree/${tree.id}`;
    }
  };

  return (
    <div className="home-shell">
      <div className="home-topbar">
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark" />
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Metrics</div>
        </div>
        <div style={{ flex: 1 }} />
        <Link href="/billing" className="tb-btn">
          Billing
        </Link>
        <Link href="/signin" className="tb-btn">
          Sign out
        </Link>
      </div>
      <div className="home-main">
        <aside className="home-side">
          <div className="home-side-title">Your workspace</div>
          <div className="home-side-sub">Builder plan · {(trees ?? []).length} trees</div>
          <nav className="home-nav">
            <a className="active">My trees</a>
            <Link href="/data-sources">Data sources</Link>
            <Link href="/billing">Billing</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/help">Help</Link>
          </nav>
          <div style={{ flex: 1 }} />
          <div className="upgrade-card">
            <div style={{ fontWeight: 600, fontSize: 12 }}>Try Pro free for 14 days</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, marginBottom: 10 }}>
              Unlimited trees, AI Copilot & Viewer Ask.
            </div>
            <Link href="/pricing" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              See plans
            </Link>
          </div>
        </aside>
        <main className="home-content">
          <div className="home-header">
            <div>
              <div className="home-greet">Welcome back.</div>
              <div className="home-sub">
                You have {(trees ?? []).length} tree{(trees ?? []).length === 1 ? '' : 's'}.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={newTree}>
                + New tree
              </button>
            </div>
          </div>
          <div className="home-stats">
            <div className="hstat">
              <div className="hstat-lbl">Trees</div>
              <div className="hstat-val">{(trees ?? []).length}</div>
            </div>
            <div className="hstat">
              <div className="hstat-lbl">Published</div>
              <div className="hstat-val">{(trees ?? []).filter((t) => t.status === 'published').length}</div>
            </div>
            <div className="hstat">
              <div className="hstat-lbl">Drafts</div>
              <div className="hstat-val">{(trees ?? []).filter((t) => t.status === 'draft').length}</div>
            </div>
            <div className="hstat">
              <div className="hstat-lbl">Nodes</div>
              <div className="hstat-val">{(trees ?? []).reduce((a, t) => a + t.nodeCount, 0)}</div>
            </div>
          </div>
          <div className="home-header" style={{ marginTop: 20 }}>
            <div className="home-greet" style={{ fontSize: 16 }}>Your trees</div>
            <input
              className="field-input"
              style={{ maxWidth: 240 }}
              placeholder="Search trees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tree-grid">
            <div className="tree-card tree-card-new" onClick={newTree}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>+</div>
              <div style={{ fontWeight: 600 }}>New metric tree</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Start from template or blank canvas</div>
            </div>
            {filtered.map((t) => (
              <Link href={`/tree/${t.id}`} key={t.id} className="tree-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="tree-preview">
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{t.nodeCount} nodes</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {t.status} · Updated {new Date(t.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
