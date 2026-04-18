const CONSENT_KEY = 'mt-gdpr-consent-v1';

let initialized = false;

function mp(): typeof import('mixpanel-browser') | null {
  if (typeof window === 'undefined') return null;
  try {
    return require('mixpanel-browser');
  } catch {
    return null;
  }
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { accepted?: boolean };
    return parsed.accepted === true;
  } catch {
    return false;
  }
}

export function setConsent(accepted: boolean, version = '1.0'): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted, version, ts: Date.now() }));
  if (accepted) initAnalytics();
}

export function initAnalytics(): void {
  if (initialized) return;
  if (!hasConsent()) return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const lib = mp();
  if (!lib || !token) return;
  lib.init(token, { track_pageview: false, persistence: 'localStorage' });
  initialized = true;
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  const lib = mp();
  if (!lib || !initialized) return;
  lib.track(event, props);
}

export function identify(userId: string): void {
  const lib = mp();
  if (!lib || !initialized) return;
  lib.identify(userId);
}

export function setPeople(props: Record<string, unknown>): void {
  const lib = mp();
  if (!lib || !initialized) return;
  lib.people.set(props);
}

export function reset(): void {
  const lib = mp();
  if (!lib || !initialized) return;
  lib.reset();
}
