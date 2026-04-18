export function genHistory(from: number, to: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = from + (to - from) * t;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * (Math.abs(to - from) * 0.04);
    out.push(base + noise);
  }
  return out;
}

export interface DesignerNode {
  id: string;
  type: 'metric';
  position: { x: number; y: number };
  data: {
    kind: 'input' | 'formula' | 'output' | 'segment' | 'strategy' | 'annotation';
    name?: string;
    unit?: string;
    owner?: string;
    formula?: string;
    target?: number | null;
    value?: number;
    chartType?: 'line' | 'area' | 'bar' | 'number';
    history?: number[];
    stats?: { mom?: string; yoy?: string; wow?: string };
    dataSource?: string;
    text?: string;
    segments?: { label: string; value: number }[];
    format?: 'number' | 'percent';
  };
}

export interface DesignerEdge {
  id: string;
  source: string;
  target: string;
  data?: { strength?: 'strong' | 'moderate' | 'weak'; op?: string };
}

export const SEED_NODES: DesignerNode[] = [
  { id: 'revenue', type: 'metric', position: { x: 560, y: 60 }, data: {
    kind: 'output', name: 'Increase Revenue', unit: '$', owner: 'HS',
    formula: 'csat_driver + engagement_driver + arpu_driver',
    target: 2_800_000, chartType: 'area',
    history: genHistory(1_820_000, 2_320_000, 12),
    stats: { mom: '+4.8%', yoy: '+23.9%' },
    dataSource: 'snowflake',
  }},
  { id: 'csat', type: 'metric', position: { x: 200, y: 340 }, data: {
    kind: 'formula', name: 'Customer Satisfaction', unit: 'NPS', owner: 'RV',
    formula: '42.4', chartType: 'line', value: 42.4,
    history: genHistory(38.2, 42.4, 12),
    stats: { mom: '+1.3%', yoy: '+14.4%' },
  }},
  { id: 'engagement', type: 'metric', position: { x: 560, y: 340 }, data: {
    kind: 'formula', name: 'Increase Engagement', unit: 'Content/MAU', owner: 'AL',
    value: 12.4, chartType: 'area',
    history: genHistory(10.6, 12.4, 12),
    stats: { mom: '+5.9%', yoy: '+3.9%' },
    target: 15,
  }},
  { id: 'arpu', type: 'metric', position: { x: 920, y: 340 }, data: {
    kind: 'formula', name: 'ARPU', unit: '$', owner: 'HS',
    formula: 'revenue / paying_users',
    value: 2.42, chartType: 'area',
    history: genHistory(1.9, 2.42, 12),
    stats: { mom: '+27.4%', yoy: '+9.9%' },
  }},
  { id: 'note1', type: 'metric', position: { x: 380, y: 340 }, data: {
    kind: 'annotation', name: 'Campaign Note', owner: 'AS',
    text: 'Increase likely driven by the launch of the new NA marketing campaign.',
  }},
  { id: 'dau_mau', type: 'metric', position: { x: 400, y: 620 }, data: {
    kind: 'input', name: 'Drive Daily Habits', unit: 'DAU/MAU', owner: 'RV',
    value: 0.238, format: 'percent', chartType: 'area',
    history: genHistory(0.21, 0.238, 12),
    stats: { mom: '+2.6%', yoy: '+3.9%' },
    dataSource: 'bigquery',
  }},
  { id: 'retention', type: 'metric', position: { x: 650, y: 620 }, data: {
    kind: 'input', name: '30 Day Retention', unit: 'Unique Users', owner: 'HS',
    value: 0.142, format: 'percent', chartType: 'line',
    history: genHistory(0.12, 0.142, 12),
    stats: { mom: '+3.1%', yoy: '+7.1%' },
    dataSource: 'bigquery',
  }},
  { id: 'subs', type: 'metric', position: { x: 900, y: 620 }, data: {
    kind: 'input', name: 'Total Subscriptions', unit: 'total', owner: 'HS',
    value: 13200, chartType: 'bar',
    history: genHistory(11800, 13200, 12),
    stats: { mom: '+1.2%', yoy: '+0.8%' },
    dataSource: 'postgres',
  }},
  { id: 'strat1', type: 'metric', position: { x: 60, y: 620 }, data: {
    kind: 'strategy', name: 'Marketing Revamp', owner: 'MF',
    text: 'Build and launch a new marketing strategy across website by May.',
  }},
];

export const SEED_EDGES: DesignerEdge[] = [
  { id: 'e1', source: 'csat', target: 'revenue', data: { strength: 'moderate', op: '+' } },
  { id: 'e2', source: 'engagement', target: 'revenue', data: { strength: 'moderate', op: '+' } },
  { id: 'e3', source: 'arpu', target: 'revenue', data: { strength: 'moderate', op: '+' } },
  { id: 'e4', source: 'dau_mau', target: 'engagement', data: { strength: 'strong' } },
  { id: 'e5', source: 'retention', target: 'engagement', data: { strength: 'moderate' } },
  { id: 'e6', source: 'subs', target: 'arpu', data: { strength: 'weak' } },
  { id: 'e8', source: 'strat1', target: 'csat', data: { strength: 'moderate' } },
  { id: 'e10', source: 'note1', target: 'csat', data: { strength: 'weak' } },
];

export const ACCENT_SWATCHES = [
  { name: 'violet', value: 'oklch(58% 0.17 295)', soft: 'oklch(96% 0.03 295)', ink: 'oklch(32% 0.08 295)' },
  { name: 'green', value: 'oklch(58% 0.14 155)', soft: 'oklch(95% 0.04 155)', ink: 'oklch(32% 0.08 155)' },
  { name: 'blue', value: 'oklch(58% 0.15 245)', soft: 'oklch(95% 0.04 245)', ink: 'oklch(32% 0.08 245)' },
  { name: 'amber', value: 'oklch(68% 0.14 70)', soft: 'oklch(96% 0.05 85)', ink: 'oklch(38% 0.1 75)' },
  { name: 'red', value: 'oklch(60% 0.18 25)', soft: 'oklch(95% 0.04 25)', ink: 'oklch(36% 0.1 25)' },
] as const;

export const LIBRARY = [
  { kind: 'input', label: 'Metric', sub: 'Raw tracked value', swatch: 'M' },
  { kind: 'formula', label: 'Formula', sub: 'Derived from inputs', swatch: 'Fx' },
  { kind: 'output', label: 'North Star', sub: 'Top-level output', swatch: '★' },
  { kind: 'segment', label: 'Breakdown', sub: 'Split by dimension', swatch: '▥' },
  { kind: 'strategy', label: 'Strategy', sub: 'Initiative / bet', swatch: '▷' },
  { kind: 'annotation', label: 'Note', sub: 'Context', swatch: '//' },
] as const;

export const TEMPLATES = [
  { id: 'saas', title: 'Company KPI Tree', desc: 'Revenue ← CSAT / Engagement / ARPU' },
  { id: 'pirate', title: 'Pirate Metrics', desc: 'AARRR funnel' },
  { id: 'marketplace', title: 'Marketplace GMV', desc: 'Supply × Demand × Take rate' },
  { id: 'blank', title: 'Blank Canvas', desc: 'Start from scratch' },
] as const;
