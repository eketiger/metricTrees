import Link from 'next/link';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', bullets: ['3 metric trees', '20 nodes per tree', 'No AI features'] },
  { id: 'pro', name: 'Pro', price: '$29/mo', bullets: ['Unlimited trees', 'Unlimited nodes', 'AI Copilot (50/day)', 'Viewer Ask'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Contact us', bullets: ['Everything in Pro', 'Unlimited AI', 'Team collaboration', 'Custom branding'] },
];

export default function PricingPage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Pricing</h1>
      <p style={{ color: 'var(--ink-3)' }}>Simple plans that scale with your tree count and team.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
        {PLANS.map((p) => (
          <div key={p.id} className="hstat" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {p.name}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{p.price}</div>
            <ul style={{ margin: '16px 0', paddingLeft: 18, color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.7 }}>
              {p.bullets.map((b) => (<li key={b}>{b}</li>))}
            </ul>
            <Link href="/signin" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Get started
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
