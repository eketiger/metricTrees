const FORBIDDEN = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
  'GRANT', 'REVOKE', 'REPLACE', 'CALL', 'LOCK', 'UNLOCK', 'LOAD',
  'HANDLER', 'EXECUTE', 'PREPARE', 'DEALLOCATE', 'SET', 'RENAME',
  'ANALYZE', 'OPTIMIZE', 'REPAIR', 'CHECK', 'CHECKSUM',
];

const ALLOWED_PREFIX = /^\s*(SELECT|WITH)\b/i;
const STATEMENT_SPLIT = /;\s*(?!$)/; // semicolons not at end-of-string

export interface SqlGuardResult {
  ok: boolean;
  error?: string;
}

/** Strips `-- ...` line comments and `/ * ... * /` block comments (concatenated to dodge parse). */
export function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ');
}

/**
 * Ensure a query is read-only: must start with SELECT or WITH, must not contain
 * forbidden keywords as statements, and must be a single statement.
 */
export function validateReadOnly(sql: string): SqlGuardResult {
  const cleaned = stripComments(sql).trim();
  if (!cleaned) return { ok: false, error: 'query is empty' };

  // Single statement only.
  const parts = cleaned.replace(/;\s*$/, '').split(STATEMENT_SPLIT);
  if (parts.length > 1) return { ok: false, error: 'only one statement allowed' };

  if (!ALLOWED_PREFIX.test(cleaned)) {
    return { ok: false, error: 'only SELECT or WITH queries are allowed' };
  }

  const upper = cleaned.toUpperCase();
  for (const kw of FORBIDDEN) {
    const re = new RegExp(`\\b${kw}\\b`);
    if (re.test(upper)) {
      // WITH ... SELECT can contain harmless keywords in string literals; we scrub literals first.
      const scrubbed = upper.replace(/'(?:[^'\\]|\\.)*'/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '');
      if (re.test(scrubbed)) return { ok: false, error: `forbidden keyword: ${kw}` };
    }
  }

  return { ok: true };
}

/** If the query has no LIMIT, append one. Best-effort, case-insensitive detection. */
export function ensureLimit(sql: string, max = 1000): string {
  const cleaned = stripComments(sql).trim().replace(/;\s*$/, '');
  if (/\blimit\b\s+\d+/i.test(cleaned)) return cleaned;
  return `${cleaned} LIMIT ${max}`;
}
