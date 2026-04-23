'use client';

import { useEffect, useRef, useState } from 'react';

export interface NodeValueUpdate {
  nodeId: string;
  value: number | null;
  sampledAt: string;
}

export interface NodeErrorUpdate {
  nodeId: string;
  error: string;
}

/**
 * Subscribe to /api/metric-trees/:treeId/live via SSE.
 * Returns a map of nodeId → latest value and any current per-node errors.
 */
export function useLiveValues(treeId: string | null, enabled: boolean) {
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!treeId || !enabled) {
      esRef.current?.close();
      esRef.current = null;
      setConnected(false);
      return;
    }

    const es = new EventSource(`/api/metric-trees/${treeId}/live`);
    esRef.current = es;

    es.addEventListener('hello', () => setConnected(true));
    es.addEventListener('node_value', (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as NodeValueUpdate;
      setValues((v) => ({ ...v, [d.nodeId]: d.value }));
      setErrors((e) => {
        if (!(d.nodeId in e)) return e;
        const n = { ...e };
        delete n[d.nodeId];
        return n;
      });
    });
    es.addEventListener('node_error', (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as NodeErrorUpdate;
      setErrors((e) => ({ ...e, [d.nodeId]: d.error }));
    });
    es.addEventListener('bye', () => {
      setConnected(false);
      es.close();
    });
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [treeId, enabled]);

  return { values, errors, connected };
}
