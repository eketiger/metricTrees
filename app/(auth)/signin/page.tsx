'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { track } from '@/lib/analytics';

export default function SignInPage() {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);

  const withProvider = (provider: 'google' | 'github') => async () => {
    setLoading(provider);
    track('User Logged In', { method: provider });
    await signIn(provider, { callbackUrl: '/home' });
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" style={{ width: 28, height: 28 }} />
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Metrics</div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Sign in or create an account</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          Continue with a provider. We&apos;ll create your workspace automatically.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <button className="auth-ghost" disabled={loading !== null} onClick={withProvider('google')}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.4H12v4.5h6.5c-.3 1.5-1.1 2.7-2.3 3.5v2.9h3.7c2.2-2 3.8-5 3.8-8.5z" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.2 1.1-3.3 0-6-2.2-7-5.2H1.2v3C3.1 21.2 7.3 24 12 24z" />
              <path fill="#FBBC05" d="M5 14.1c-.3-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5v-3H1.2C.5 7.7 0 9.8 0 12s.5 4.3 1.2 6.1L5 14.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.7 1.8l3.3-3.3C17.9 1.2 15.2 0 12 0 7.3 0 3.1 2.8 1.2 6.9L5 9.8c1-3 3.7-5 7-5z" />
            </svg>
            Continue with Google
          </button>
          <button className="auth-ghost" disabled={loading !== null} onClick={withProvider('github')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .3C5.4.3 0 5.7 0 12.4c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.3 1.8 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.3c0 .3.2.7.8.6 4.8-1.6 8.2-6.1 8.2-11.4C24 5.7 18.6.3 12 .3z" />
            </svg>
            Continue with GitHub
          </button>
        </div>
        <div className="auth-or">
          <span>or</span>
        </div>
        <a className="auth-primary" href="/home" style={{ textDecoration: 'none', textAlign: 'center' }}>
          Try the demo
        </a>
        <div className="auth-foot">
          By continuing you agree to our <a href="/privacy">Privacy Policy</a>.
        </div>
      </div>
      <div className="auth-hero">
        <div className="auth-hero-title">Turn your metrics into a living tree.</div>
        <div className="auth-hero-sub">
          Map causal relationships between KPIs, pull data live from your warehouse, run experiments,
          and align every team around the same numbers.
        </div>
        <div className="auth-hero-badges">
          <div className="auth-badge">⚡ Live SQL</div>
          <div className="auth-badge">◇ Formula engine</div>
          <div className="auth-badge">🤖 AI Copilot</div>
          <div className="auth-badge">✓ SOC 2</div>
        </div>
      </div>
    </div>
  );
}
