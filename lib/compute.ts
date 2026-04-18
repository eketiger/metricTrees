export function slugify(name: string | null | undefined): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const RESERVED = new Set([
  'min', 'max', 'abs', 'log', 'sqrt', 'pow', 'exp', 'floor', 'ceil', 'round',
  'if', 'true', 'false',
]);

export function extractIdents(formula: string | null | undefined): string[] {
  if (!formula) return [];
  const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  return [...new Set(matches.filter((m) => !RESERVED.has(m)))];
}

export interface EvalResult {
  ok: boolean;
  value?: number;
  error?: string;
}

export function evalFormula(formula: string, scope: Record<string, number>): EvalResult {
  if (!formula.trim()) return { ok: false, error: 'empty' };
  try {
    const idents = extractIdents(formula);
    const args: string[] = [];
    const vals: unknown[] = [];
    for (const id of idents) {
      if (!(id in scope)) return { ok: false, error: `missing: ${id}` };
      args.push(id);
      vals.push(Number(scope[id]));
    }
    args.push('min', 'max', 'abs', 'log', 'sqrt', 'pow', 'exp', 'floor', 'ceil', 'round');
    vals.push(
      Math.min, Math.max, Math.abs, Math.log, Math.sqrt, Math.pow, Math.exp,
      Math.floor, Math.ceil, Math.round,
    );
    const expr = formula.replace(/\^/g, '**');
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function(...args, `"use strict"; return (${expr});`);
    const result = fn(...vals);
    if (typeof result !== 'number' || !isFinite(result)) return { ok: false, error: 'non-numeric' };
    return { ok: true, value: result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface ComputeNode {
  id: string;
  data: {
    kind: 'input' | 'formula' | 'output' | string;
    name?: string;
    value?: number;
    formula?: string;
  };
}

export function computeAll(nodes: ComputeNode[]): { computed: Record<string, number>; errors: Record<string, string> } {
  const slugToId = new Map<string, string>();
  for (const n of nodes) {
    if (n.data.kind === 'input' || n.data.kind === 'formula') {
      slugToId.set(slugify(n.data.name), n.id);
      slugToId.set(n.id, n.id);
    }
  }

  const deps = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.data.kind === 'formula' || n.data.kind === 'output') {
      const idents = extractIdents(n.data.formula ?? '');
      deps.set(n.id, idents.map((i) => slugToId.get(i)).filter((v): v is string => !!v));
    }
  }

  const computed: Record<string, number> = {};
  for (const n of nodes) {
    if (n.data.kind === 'input') computed[n.id] = Number(n.data.value) || 0;
  }

  const formulaNodes = nodes.filter((n) => n.data.kind === 'formula' || n.data.kind === 'output');
  const errors: Record<string, string> = {};
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const n of formulaNodes) {
      if (n.id in computed) continue;
      const myDeps = deps.get(n.id) ?? [];
      if (!myDeps.every((d) => d in computed)) continue;
      const scope: Record<string, number> = {};
      for (const nn of nodes) {
        if (nn.id in computed) {
          scope[slugify(nn.data.name)] = computed[nn.id];
          scope[nn.id] = computed[nn.id];
        }
      }
      const res = evalFormula(n.data.formula ?? '', scope);
      if (res.ok && res.value != null) {
        computed[n.id] = res.value;
        changed = true;
      } else if (res.error) {
        errors[n.id] = res.error;
      }
    }
    if (!changed) break;
  }
  return { computed, errors };
}

export function formatValue(value: number | null | undefined, unit?: string | null, format?: string | null): string {
  if (value == null || !isFinite(value)) return '—';
  if (format === 'percent') return (value * 100).toFixed(1) + '%';
  const abs = Math.abs(value);
  let str: string;
  if (abs >= 1_000_000_000) str = (value / 1_000_000_000).toFixed(2) + 'B';
  else if (abs >= 1_000_000) str = (value / 1_000_000).toFixed(2) + 'M';
  else if (abs >= 10_000) str = (value / 1000).toFixed(1) + 'K';
  else if (abs >= 1000) str = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  else if (abs >= 1) str = value.toFixed(abs < 10 ? 2 : 0);
  else str = value.toFixed(3);
  return unit === '$' ? '$' + str : str;
}

export function formatDelta(curr: number | null | undefined, prev: number | null | undefined) {
  if (prev == null || curr == null || prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { text: sign + pct.toFixed(1) + '%', positive: pct >= 0 };
}
