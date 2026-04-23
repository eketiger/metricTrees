import { validateReadOnly, ensureLimit, stripComments } from '@/lib/sql-guard';

describe('validateReadOnly', () => {
  it('allows a simple SELECT', () => {
    expect(validateReadOnly('SELECT 1')).toEqual({ ok: true });
  });

  it('allows a CTE starting with WITH', () => {
    expect(validateReadOnly('WITH x AS (SELECT 1) SELECT * FROM x')).toEqual({ ok: true });
  });

  it('rejects empty strings', () => {
    expect(validateReadOnly('   ').ok).toBe(false);
  });

  it('rejects non-SELECT prefixes', () => {
    expect(validateReadOnly('INSERT INTO t VALUES (1)').ok).toBe(false);
    expect(validateReadOnly('DROP TABLE users').ok).toBe(false);
  });

  it('rejects forbidden keywords inside a SELECT', () => {
    expect(validateReadOnly('SELECT * FROM t; DELETE FROM t').ok).toBe(false);
    expect(validateReadOnly('SELECT * FROM t WHERE 1=1; DROP TABLE t').ok).toBe(false);
  });

  it('allows forbidden keywords inside quoted literals', () => {
    const r = validateReadOnly(`SELECT 'DELETE FROM t' AS lbl`);
    expect(r.ok).toBe(true);
  });

  it('rejects multi-statements', () => {
    const r = validateReadOnly('SELECT 1; SELECT 2');
    expect(r.ok).toBe(false);
  });
});

describe('ensureLimit', () => {
  it('appends a LIMIT when missing', () => {
    expect(ensureLimit('SELECT 1', 500)).toMatch(/LIMIT 500$/);
  });
  it('leaves existing LIMIT untouched', () => {
    expect(ensureLimit('SELECT 1 LIMIT 3')).toBe('SELECT 1 LIMIT 3');
  });
  it('strips trailing semicolon', () => {
    expect(ensureLimit('SELECT 1;', 10)).toMatch(/SELECT 1 LIMIT 10$/);
  });
});

describe('stripComments', () => {
  it('removes line and block comments', () => {
    const cleaned = stripComments('SELECT 1 -- foo\n/* bar */ FROM t');
    expect(cleaned).not.toContain('--');
    expect(cleaned).not.toContain('/*');
  });
});
