'use client';

import { useState } from 'react';
import type { Node } from 'reactflow';

type CopilotAction =
  | 'improve_description'
  | 'suggest_children'
  | 'suggest_formula'
  | 'explain_metric'
  | 'validate_tree'
  | 'suggest_kpis';

export function CopilotToolbar({ treeId, node, onPatch }: {
  treeId: string;
  node: Node;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggest = async (action: CopilotAction) => {
    setLoading(true);
    setSuggestion(null);
    try {
      const res = await fetch('/api/copilot/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeId,
          nodeId: node.id,
          action,
          selectedText: (node.data as { description?: string; name?: string }).description ?? (node.data as { name?: string }).name ?? '',
          nodeType: (node.data as { kind?: string }).kind ?? 'input',
        }),
      });
      const data = await res.json();
      setSuggestion(data.suggestion ?? 'No response.');
    } catch (e) {
      setSuggestion('AI features are temporarily busy.');
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (suggestion) onPatch({ description: suggestion });
    setSuggestion(null);
  };

  return (
    <>
      <div className="right-tabs">
        <div className="right-tab active">Copilot</div>
      </div>
      <div className="right-body">
        <div className="insp-header">
          <span className="insp-kind-chip">{(node.data as { kind?: string }).kind ?? 'node'}</span>
          <div className="insp-title-input">{(node.data as { name?: string }).name ?? 'Untitled'}</div>
        </div>
        <div className="insp-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-ghost" onClick={() => suggest('improve_description')}>Improve description</button>
          <button className="btn-ghost" onClick={() => suggest('suggest_children')}>Suggest children</button>
          <button className="btn-ghost" onClick={() => suggest('suggest_formula')}>Suggest formula</button>
          <button className="btn-ghost" onClick={() => suggest('explain_metric')}>Explain metric</button>
          <button className="btn-ghost" onClick={() => suggest('validate_tree')}>Validate tree</button>
          {loading && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Thinking…</div>}
          {suggestion && (
            <div style={{ marginTop: 8, padding: 10, background: 'var(--surface-2)', borderRadius: 6, fontSize: 12 }}>
              <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{suggestion}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-primary" onClick={accept}>Accept</button>
                <button className="btn-ghost" onClick={() => setSuggestion(null)}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
