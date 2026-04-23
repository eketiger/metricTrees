'use client';

import { useEffect, useState } from 'react';
import type { DataSource } from './DataSourcesModal';

interface QueryPanelProps {
  treeId: string;
  nodeId: string;
  dataSourceId: string | null;
  initialQuery: string;
  onValue: (value: number | null, sampledAt: string) => void;
  onError: (err: string) => void;
  onDataSourceChange: (id: string | null) => void;
  onOpenDataSources: () => void;
}

export function QueryPanel({
  treeId, nodeId, dataSourceId, initialQuery,
  onValue, onError, onDataSourceChange, onOpenDataSources,
}: QueryPanelProps) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ value: number | null; sampledAt: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);

  useEffect(() => {
    fetch('/api/data-sources')
      .then((r) => r.json())
      .then((d: { dataSources?: DataSource[] }) => setSources(d.dataSources ?? []))
      .catch(() => setSources([]));
  }, []);

  const run = async () => {
    if (!dataSourceId) {
      setErr('Pick a data source first.');
      return;
    }
    setRunning(true);
    setErr(null);
    try {
      const res = await fetch(`/api/metric-trees/${treeId}/nodes/${nodeId}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'Query failed');
        onError(data.error ?? 'Query failed');
      } else {
        setResult({ value: data.value, sampledAt: data.sampledAt });
        onValue(data.value, data.sampledAt);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="field">
        <div className="field-label" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span>Data source</span>
          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 10 }} onClick={onOpenDataSources}>Manage</button>
        </div>
        <select
          className="field-select"
          value={dataSourceId ?? ''}
          onChange={(e) => onDataSourceChange(e.target.value || null)}
        >
          <option value="">— none (manual value) —</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.host}/{s.database}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <div className="field-label">SQL (read-only)</div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 140, background: 'var(--ink)', color: '#86efac',
            fontFamily: 'var(--font-mono)', fontSize: 12, border: 0, borderRadius: 4,
            padding: 10, outline: 'none', resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
          Must start with <code>SELECT</code> or <code>WITH</code>. First numeric column of first row is used.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={run} disabled={running || !dataSourceId}>
          {running ? 'Running…' : '⚡ Run & sync'}
        </button>
      </div>

      {err && (
        <div style={{
          padding: 10, background: 'color-mix(in oklch, var(--danger) 10%, transparent)',
          color: 'var(--danger)', borderRadius: 4, fontSize: 12,
        }}>{err}</div>
      )}

      {result && (
        <div style={{
          padding: 10, background: 'var(--surface-2)', borderRadius: 4, fontSize: 12,
        }}>
          <div>
            Value: <strong style={{ fontFamily: 'var(--font-mono)' }}>
              {result.value == null ? '—' : result.value}
            </strong>
          </div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11 }}>
            Sampled {new Date(result.sampledAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
