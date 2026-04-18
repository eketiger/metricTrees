import { normalizePlan, limitsFor, planQualifies } from '@/lib/plans';

describe('normalizePlan', () => {
  it('defaults unknowns to free', () => {
    expect(normalizePlan(null)).toBe('free');
    expect(normalizePlan(undefined)).toBe('free');
    expect(normalizePlan('hacker')).toBe('free');
  });
  it('passes known plans through', () => {
    expect(normalizePlan('pro')).toBe('pro');
    expect(normalizePlan('enterprise')).toBe('enterprise');
  });
});

describe('limitsFor', () => {
  it('free plan is AI-disabled and capped', () => {
    const l = limitsFor('free');
    expect(l.aiEnabled).toBe(false);
    expect(l.maxTrees).toBe(3);
  });
  it('pro plan enables Copilot', () => {
    expect(limitsFor('pro').copilotDailyRequests).toBe(50);
  });
  it('enterprise is unlimited', () => {
    expect(limitsFor('enterprise').copilotDailyRequests).toBe(Infinity);
  });
});

describe('planQualifies', () => {
  it('pro qualifies for pro', () => {
    expect(planQualifies('pro', 'pro')).toBe(true);
  });
  it('free does not qualify for pro', () => {
    expect(planQualifies('free', 'pro')).toBe(false);
  });
  it('enterprise qualifies for pro', () => {
    expect(planQualifies('enterprise', 'pro')).toBe(true);
  });
});
