import Link from 'next/link';

export default function MarketingHome() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid var(--line)' }}>
        <div className="brand">
          <div className="brand-mark" style={{ width: 24, height: 24 }} />
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Metrics</span>
        </div>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 22, alignItems: 'center' }}>
          <Link href="/docs" style={{ fontSize: 13, color: 'var(--ink-2)' }}>Docs</Link>
          <Link href="/help" style={{ fontSize: 13, color: 'var(--ink-2)' }}>Help</Link>
          <Link href="/api-reference" style={{ fontSize: 13, color: 'var(--ink-2)' }}>API</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: 'var(--ink-2)' }}>Pricing</Link>
          <Link href="/signin" className="btn-primary" style={{ textDecoration: 'none' }}>Sign in</Link>
        </nav>
      </header>

      <section style={{ padding: '80px 32px', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>
          Turn your metrics into a living tree.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-3)', marginTop: 20, lineHeight: 1.5 }}>
          Map causal relationships between KPIs, pull data live from your warehouse, run experiments,
          and align every team around the same numbers. AI Copilot helps Builders draft nodes; Viewers
          can ask natural-language questions about any tree.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
          <Link href="/signin" className="btn-primary">Start free</Link>
          <Link href="/docs" className="btn-ghost">Read the docs</Link>
        </div>
      </section>

      <section style={{ padding: '0 32px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 1040, margin: '0 auto' }}>
        {[
          { title: 'Builder Copilot', desc: 'Suggest KPIs, improve descriptions, validate tree structure.' },
          { title: 'Viewer Ask', desc: 'Ask any metric tree questions in natural language — answers grounded in the tree.' },
          { title: 'Live data', desc: 'Connect Snowflake, BigQuery, Postgres, PlanetScale and more.' },
          { title: 'Experiments', desc: 'Track lifts and attach experiments to the metrics they moved.' },
        ].map((f) => (
          <div key={f.title} className="hstat" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{f.desc}</div>
          </div>
        ))}
      </section>

      <footer style={{ padding: '20px 32px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)' }}>
        <div>© {new Date().getFullYear()} Metrics</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
          <Link href="/cookies" style={{ color: 'inherit' }}>Cookies</Link>
          <Link href="/docs/api/overview" style={{ color: 'inherit' }}>API</Link>
        </div>
      </footer>
    </main>
  );
}
