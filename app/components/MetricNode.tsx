'use client';

import React, { useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { formatValue, formatDelta } from '@/lib/compute';

interface NodeData {
  kind: 'input' | 'formula' | 'output' | 'segment' | 'strategy' | 'annotation';
  name?: string;
  value?: number;
  unit?: string;
  owner?: string;
  formula?: string;
  history?: number[];
  target?: number | null;
  segments?: { label: string; value: number }[];
  format?: 'number' | 'percent';
  text?: string;
  editing?: boolean;
  computedValue?: number;
  error?: string;
  dimmed?: boolean;
  highlight?: boolean;
  chartType?: 'line' | 'area' | 'bar' | 'number';
  dataSource?: string;
  stats?: { mom?: string; yoy?: string; wow?: string };
  onRename?: (id: string, name: string, cancel?: boolean) => void;
}

function NodeChart({ values, type = 'area' }: { values: number[]; type?: 'line' | 'area' | 'bar' | 'number' }) {
  if (!values || values.length < 2) return null;
  const w = 200, h = 42, pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  if (type === 'bar') {
    const bw = (w - pad * 2) / values.length - 1.5;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {values.map((v, i) => {
          const x = pad + (i / values.length) * (w - pad * 2);
          const barH = ((v - min) / range) * (h - pad * 2) || 1;
          const y = h - pad - barH;
          return <rect key={i} className="spark-bar" x={x} y={y} width={bw} height={barH} rx="1" />;
        })}
      </svg>
    );
  }
  if (type === 'number') return null;
  const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const fillD = d + ` L${points[points.length - 1][0].toFixed(1)},${h - pad} L${points[0][0].toFixed(1)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {type === 'area' && <path className="spark-fill" d={fillD} />}
      <path className="spark-path" d={d} />
      <circle className="spark-dot" cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2" />
    </svg>
  );
}

function KindIcon({ kind }: { kind: NodeData['kind'] }) {
  if (kind === 'output') return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" /><circle cx="6" cy="6" r="1.5" fill="currentColor" /></svg>);
  if (kind === 'formula') return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 10c2 0 2-8 4-8M2 6h6" stroke="currentColor" strokeLinecap="round" /></svg>);
  if (kind === 'segment') return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="6" width="2" height="4" fill="currentColor" /><rect x="5" y="3" width="2" height="7" fill="currentColor" /><rect x="8.5" y="1" width="2" height="9" fill="currentColor" /></svg>);
  if (kind === 'strategy') return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 10V2l3 2 3-2v8" stroke="currentColor" strokeLinejoin="round" /></svg>);
  if (kind === 'annotation') return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8v6l-2 2H2V3z" stroke="currentColor" strokeLinejoin="round" /></svg>);
  return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" /></svg>);
}

export function MetricNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (data.editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [data.editing]);

  const handleRename = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if ('key' in e && e.key === 'Escape') {
      data.onRename?.(id, data.name ?? '', true);
    } else if (!('key' in e) || e.key === 'Enter') {
      e.preventDefault?.();
      data.onRename?.(id, inputRef.current?.value ?? '');
    }
  };

  const displayValue = data.computedValue != null ? data.computedValue : data.value;

  if (data.kind === 'annotation') {
    return (
      <div className={`metric-node type-annotation${selected ? ' selected' : ''}${data.dimmed ? ' dim' : ''}`}>
        <div className="node-head">
          <span className="node-icon"><KindIcon kind="annotation" /></span>
          <div className="node-name">{data.name || 'Note'}</div>
          {data.owner && <div className="owner-chip">{data.owner}</div>}
        </div>
        <div style={{ padding: '4px 12px 12px', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{data.text || 'Add a note…'}</div>
        <Handle type="target" position={Position.Bottom} />
        <Handle type="source" position={Position.Top} />
      </div>
    );
  }

  if (data.kind === 'segment') {
    const segs = data.segments ?? [];
    const maxV = Math.max(...segs.map((s) => s.value), 0.01);
    return (
      <div className={`metric-node${selected ? ' selected' : ''}${data.dimmed ? ' dim' : ''}`}>
        <div className="node-head">
          <span className="node-icon"><KindIcon kind="segment" /></span>
          <div className="node-name">{data.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', padding: '6px 12px 10px', height: 60 }}>
          {segs.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%' }}>
              <div style={{ width: '100%', background: 'var(--accent)', opacity: 0.75, borderRadius: '2px 2px 0 0', minHeight: 2, height: `${(s.value / maxV) * 85}%` }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <Handle type="target" position={Position.Bottom} />
        <Handle type="source" position={Position.Top} />
      </div>
    );
  }

  const hist = data.history ?? [];
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;
  const mom = data.stats?.mom ?? formatDelta(displayValue ?? hist[hist.length - 1], prev)?.text;
  const yoy = data.stats?.yoy ?? (hist.length > 11 ? formatDelta(hist[hist.length - 1], hist[0])?.text : null);
  const momPos = !!mom && !mom.startsWith('-');
  const yoyPos = !!yoy && !yoy.startsWith('-');
  const hasTarget = data.target != null && data.kind === 'output';
  const pct = hasTarget ? Math.min(1, (displayValue ?? 0) / (data.target ?? 1)) : 0;

  return (
    <div className={`metric-node type-${data.kind}${selected ? ' selected' : ''}${data.dimmed ? ' dim' : ''}${data.highlight ? ' highlight' : ''}`}>
      <div className="node-head">
        <span className="node-icon"><KindIcon kind={data.kind} /></span>
        {data.editing ? (
          <input ref={inputRef} className="node-name" defaultValue={data.name}
            onBlur={handleRename} onKeyDown={handleRename}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'transparent', border: 0, outline: '1px solid var(--accent)' }} />
        ) : (
          <div className="node-name">{data.name}</div>
        )}
        {data.owner && <div className="owner-chip">{data.owner}</div>}
      </div>
      <div className="node-body">
        <div className="node-value">{formatValue(displayValue, data.unit, data.format)}</div>
        <div className="node-unit">{data.format === 'percent' ? '' : (data.unit === '$' ? 'USD' : data.unit || 'value')}</div>
        {data.chartType !== 'number' && (
          <div className="node-chart">
            <NodeChart values={hist} type={data.chartType ?? 'area'} />
          </div>
        )}
        {data.error && <div style={{ color: 'var(--danger)', fontSize: 10, padding: '4px 8px' }}>⚠ {data.error}</div>}
      </div>
      {hasTarget && data.target != null && (
        <div style={{ margin: '4px 10px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-3)' }}>
          <span>Target {formatValue(data.target, data.unit, data.format)}</span>
          <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'var(--accent)', width: `${pct * 100}%` }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--success)' }}>{pct >= 0.95 ? 'On track' : `${(pct * 100).toFixed(0)}%`}</span>
        </div>
      )}
      {(mom || yoy) && (
        <div className="node-stats">
          {mom && (<div className="node-stat"><div className="node-stat-label">MoM</div><div className={`node-stat-val ${momPos ? 'pos' : 'neg'}`}>{mom}</div></div>)}
          {yoy && (<div className="node-stat"><div className="node-stat-label">YoY</div><div className={`node-stat-val ${yoyPos ? 'pos' : 'neg'}`}>{yoy}</div></div>)}
        </div>
      )}
      {data.dataSource && (
        <div className="node-source-chip" title={`Connected to ${data.dataSource}`}>
          <span className="node-source-dot" />
          {data.dataSource}
        </div>
      )}
      <Handle type="target" position={Position.Bottom} />
      <Handle type="source" position={Position.Top} />
    </div>
  );
}
