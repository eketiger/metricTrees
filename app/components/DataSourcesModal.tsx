'use client';

import { useEffect, useState } from 'react';

export interface DataSource {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  status: 'idle' | 'connected' | 'error' | 'syncing';
  lastError?: string | null;
  lastTestAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

type Mode = 'basic' | 'url';

interface NewForm {
  mode: Mode;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  url: string;
}

const EMPTY_FORM: NewForm = {
  mode: 'basic', name: '', host: '', port: 3306, database: '',
  username: '', password: '', ssl: true, url: '',
};

export function DataSourcesModal({ onClose, onChange }: { onClose: () => void; onChange?: (sources: DataSource[]) => void }) {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewForm>(EMPTY_FORM);
  const [err, setErr] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/data-sources')
      .then((r) => r.json())
      .then((d: { dataSources?: DataSource[] }) => setSources(d.dataSources ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onChange?.(sources);
  }, [sources, onChange]);

  const save = async () => {
    setErr(null);
    setTesting(true);
    try {
      const body = form.mode === 'url'
        ? { mode: 'url', name: form.name, url: form.url, ssl: form.ssl, testOnSave: true }
        : {
            mode: 'basic', name: form.name, host: form.host, port: Number(form.port) || 3306,
            database: form.database, username: form.username, password: form.password,
            ssl: form.ssl, testOnSave: true,
          };
      const res = await fetch('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Failed to save');
        return;
      }
      setSources((s) => [data.dataSource, ...s]);
      setForm(EMPTY_FORM);
      setView('list');
    } finally {
      setTesting(false);
    }
  };

  const test = async (id: string) => {
    setSources((s) => s.map((d) => d.id === id ? { ...d, status: 'syncing' } : d));
    const res = await fetch(`/api/data-sources/${id}/test`, { method: 'POST' });
    const data = await res.json();
    setSources((s) =>
      s.map((d) =>
        d.id === id
          ? { ...d, status: data.ok ? 'connected' : 'error', lastError: data.ok ? null : data.error, lastTestAt: new Date().toISOString() }
          : d,
      ),
    );
  };

  const remove = async (id: string) => {
    if (!confirm('Disconnect and delete this data source?')) return;
    const res = await fetch(`/api/data-sources/${id}`, { method: 'DELETE' });
    if (res.ok) setSources((s) => s.filter((d) => d.id !== id));
  };

  const set = <K extends keyof NewForm>(k: K, v: NewForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Data sources</div>
          <div style={{ flex: 1 }} />
          {view === 'list' ? (
            <button className="btn-primary" onClick={() => setView('new')}>+ New connection</button>
          ) : (
            <button className="btn-ghost" onClick={() => { setView('list'); setErr(null); }}>← Back</button>
          )}
          <button className="btn-ghost" style={{ marginLeft: 6 }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 18, maxHeight: '70vh', overflow: 'auto' }}>
          {view === 'list' && (
            <>
              {loading ? (
                <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>Loading…</div>
              ) : sources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 12px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No data sources yet</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12, marginBottom: 14 }}>
                    Connect a MySQL database to pull metric values automatically.
                  </div>
                  <button className="btn-primary" onClick={() => setView('new')}>+ Connect MySQL</button>
                </div>
              ) : (
                sources.map((d) => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                    border: '1px solid var(--line)', borderRadius: 8, marginBottom: 8,
                    background: 'var(--surface)',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 6, background: '#00618A', color: '#F29111',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>My</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
                          color: d.status === 'connected' ? 'var(--success)' : d.status === 'error' ? 'var(--danger)' : 'var(--ink-3)',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: d.status === 'connected' ? 'var(--success)' : d.status === 'error' ? 'var(--danger)' : 'var(--ink-4)',
                          }} />
                          {d.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.username}@{d.host}:{d.port}/{d.database}
                      </div>
                      {d.lastError && (
                        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{d.lastError}</div>
                      )}
                    </div>
                    <button className="btn-ghost" onClick={() => test(d.id)} title="Test connection">↻</button>
                    <button className="btn-ghost danger" onClick={() => remove(d.id)}>Remove</button>
                  </div>
                ))
              )}
            </>
          )}

          {view === 'new' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: '#00618A', color: '#F29111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700,
                }}>My</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Connect MySQL</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    Credentials are encrypted at rest with AES-256-GCM. Only read-only queries are allowed.
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="field-label">Connection name</div>
                <input className="field-input" placeholder="prod-analytics"
                  value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>

              <div className="field">
                <div className="field-label">Mode</div>
                <div className="seg-choice">
                  <button className={form.mode === 'basic' ? 'on' : ''} onClick={() => set('mode', 'basic')}>Basic</button>
                  <button className={form.mode === 'url' ? 'on' : ''} onClick={() => set('mode', 'url')}>Connection URL</button>
                </div>
              </div>

              {form.mode === 'basic' ? (
                <>
                  <div className="field-row">
                    <div className="field" style={{ flex: 2 }}>
                      <div className="field-label">Host</div>
                      <input className="field-input mono" placeholder="mysql.example.com"
                        value={form.host} onChange={(e) => set('host', e.target.value)} />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <div className="field-label">Port</div>
                      <input className="field-input mono" type="number" placeholder="3306"
                        value={form.port} onChange={(e) => set('port', Number(e.target.value) || 3306)} />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label">Database</div>
                    <input className="field-input mono" placeholder="mydb"
                      value={form.database} onChange={(e) => set('database', e.target.value)} />
                  </div>
                  <div className="field-row">
                    <div className="field" style={{ flex: 1 }}>
                      <div className="field-label">Username</div>
                      <input className="field-input mono" placeholder="readonly_user"
                        value={form.username} onChange={(e) => set('username', e.target.value)} />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <div className="field-label">Password</div>
                      <input className="field-input mono" type="password" placeholder="••••••••"
                        value={form.password} onChange={(e) => set('password', e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="field">
                  <div className="field-label">Connection URL</div>
                  <input className="field-input mono"
                    placeholder="mysql://user:password@host:3306/database"
                    value={form.url} onChange={(e) => set('url', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                    Accepts <code>mysql://</code> or <code>jdbc:mysql://</code> URLs.
                  </div>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ssl} onChange={(e) => set('ssl', e.target.checked)} />
                <span style={{ fontSize: 12.5 }}>Require SSL</span>
              </label>

              {err && (
                <div style={{ padding: 10, background: 'color-mix(in oklch, var(--danger) 10%, transparent)',
                  color: 'var(--danger)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>
                  {err}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1 }} />
                <button className="btn-ghost" onClick={() => { setView('list'); setErr(null); }}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={testing}>
                  {testing ? 'Authenticating…' : 'Authenticate & save'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
