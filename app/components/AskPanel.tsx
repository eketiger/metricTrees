'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AskPanel({ treeId, onClose }: { treeId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setQ('');
    const nextHistory = [...messages, { role: 'user' as const, content: question }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const res = await fetch(`/api/metric-trees/${treeId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversationHistory: nextHistory.slice(0, -1) }),
      });
      const answer = res.ok ? (await res.json()).answer : 'Something went wrong.';
      setMessages([...nextHistory, { role: 'assistant', content: answer }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20, width: 360, height: 480,
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
      boxShadow: 'var(--shadow-2)', display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Ask this tree</div>
        <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Ask about any metric in this tree. Answers are based solely on this tree&apos;s data.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'var(--ink)' : 'var(--surface-2)',
            color: m.role === 'user' ? 'white' : 'var(--ink)',
            padding: '8px 10px', borderRadius: 10, maxWidth: '85%', fontSize: 12.5, whiteSpace: 'pre-wrap',
          }}>{m.content}</div>
        ))}
        {loading && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Thinking…</div>}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid var(--line)', display: 'flex', gap: 6 }}>
        <input
          className="field-input"
          placeholder="Ask a question…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn-primary" disabled={loading} onClick={send}>Send</button>
      </div>
    </div>
  );
}
