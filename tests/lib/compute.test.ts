import { slugify, extractIdents, evalFormula, computeAll, formatValue, formatDelta } from '@/lib/compute';

describe('slugify', () => {
  it('normalizes names', () => {
    expect(slugify('Customer Satisfaction')).toBe('customer_satisfaction');
    expect(slugify('  hello  world!! ')).toBe('hello_world');
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
  });
});

describe('extractIdents', () => {
  it('returns user-defined identifiers only', () => {
    const idents = extractIdents('min(a, b) + sqrt(c)');
    expect(idents.sort()).toEqual(['a', 'b', 'c']);
  });
  it('returns [] for empty', () => {
    expect(extractIdents('')).toEqual([]);
    expect(extractIdents(null)).toEqual([]);
  });
});

describe('evalFormula', () => {
  it('evaluates simple arithmetic', () => {
    expect(evalFormula('a + b', { a: 2, b: 3 })).toEqual({ ok: true, value: 5 });
  });
  it('fails on missing scope', () => {
    expect(evalFormula('a + b', { a: 2 })).toEqual({ ok: false, error: 'missing: b' });
  });
  it('fails on empty formula', () => {
    expect(evalFormula('   ', {})).toEqual({ ok: false, error: 'empty' });
  });
  it('fails on non-numeric', () => {
    expect(evalFormula('a + b', { a: NaN, b: 1 }).ok).toBe(false);
  });
  it('supports ^ as exponent', () => {
    expect(evalFormula('a^2', { a: 3 })).toEqual({ ok: true, value: 9 });
  });
  it('catches syntax errors', () => {
    const r = evalFormula('a +', { a: 1 });
    expect(r.ok).toBe(false);
  });
});

describe('computeAll', () => {
  it('computes inputs and formulas', () => {
    const nodes = [
      { id: 'a', data: { kind: 'input', name: 'A', value: 2 } },
      { id: 'b', data: { kind: 'input', name: 'B', value: 3 } },
      { id: 'c', data: { kind: 'formula', name: 'C', formula: 'a + b' } },
    ];
    const { computed, errors } = computeAll(nodes);
    expect(computed).toEqual({ a: 2, b: 3, c: 5 });
    expect(errors).toEqual({});
  });
  it('reports formula errors', () => {
    const nodes = [
      { id: 'a', data: { kind: 'input', name: 'A', value: 2 } },
      { id: 'b', data: { kind: 'formula', name: 'B', formula: 'a + xxx' } },
    ];
    const { computed, errors } = computeAll(nodes);
    expect(computed.a).toBe(2);
    expect(errors.b).toMatch(/missing/);
  });
});

describe('formatValue', () => {
  it('returns em-dash for nullish', () => {
    expect(formatValue(null)).toBe('—');
    expect(formatValue(undefined)).toBe('—');
    expect(formatValue(Infinity)).toBe('—');
  });
  it('formats percentages', () => {
    expect(formatValue(0.238, '%', 'percent')).toBe('23.8%');
  });
  it('formats numbers with magnitude', () => {
    expect(formatValue(1500)).toBe('1,500');
    expect(formatValue(12500)).toBe('12.5K');
    expect(formatValue(1_500_000)).toBe('1.50M');
    expect(formatValue(3_000_000_000)).toBe('3.00B');
    expect(formatValue(0.345)).toBe('0.345');
  });
  it('prepends $ for dollar unit', () => {
    expect(formatValue(100, '$')).toBe('$100');
  });
});

describe('formatDelta', () => {
  it('returns null when prev is missing or zero', () => {
    expect(formatDelta(10, null)).toBeNull();
    expect(formatDelta(10, 0)).toBeNull();
    expect(formatDelta(null, 10)).toBeNull();
  });
  it('returns a signed percentage', () => {
    expect(formatDelta(110, 100)).toEqual({ text: '+10.0%', positive: true });
    expect(formatDelta(90, 100)).toEqual({ text: '-10.0%', positive: false });
  });
});
