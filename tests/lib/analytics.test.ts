/** @jest-environment jsdom */
import { hasConsent, setConsent } from '@/lib/analytics';

describe('consent storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with no consent', () => {
    expect(hasConsent()).toBe(false);
  });

  it('records acceptance', () => {
    setConsent(true);
    expect(hasConsent()).toBe(true);
  });

  it('records rejection', () => {
    setConsent(false);
    expect(hasConsent()).toBe(false);
  });

  it('ignores malformed storage', () => {
    window.localStorage.setItem('mt-gdpr-consent-v1', '{not json');
    expect(hasConsent()).toBe(false);
  });
});
