export interface ChunkableTree {
  title: string;
  description?: string | null;
}

export interface ChunkableNode {
  title: string;
  description?: string | null;
  metricType: string;
  unit?: string | null;
  targetValue?: number | null;
  currentValue?: number | null;
  formula?: string | null;
  depth: number;
}

const TARGET_WORDS = 400;
const OVERLAP_WORDS = 50;

function formatNode(n: ChunkableNode): string {
  const parts = [`[depth-${n.depth}] ${n.title} (${n.metricType})`];
  if (n.description) parts.push(`: ${n.description}`);
  if (n.targetValue != null) parts.push(` Target: ${n.targetValue}${n.unit ? ' ' + n.unit : ''}.`);
  if (n.currentValue != null) parts.push(` Current: ${n.currentValue}${n.unit ? ' ' + n.unit : ''}.`);
  if (n.formula) parts.push(` Formula: ${n.formula}.`);
  return parts.join('');
}

export function serializeTree(tree: ChunkableTree, nodes: ChunkableNode[]): string[] {
  const header = [`# ${tree.title}`];
  if (tree.description) header.push(tree.description);
  return [header.join('\n'), ...nodes.map(formatNode)];
}

export function chunkMetricTree(tree: ChunkableTree, nodes: ChunkableNode[]): string[] {
  const sentences = serializeTree(tree, nodes);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (currentWords + words > TARGET_WORDS && current.length > 0) {
      chunks.push(current.join('\n'));
      const overlapText = current.join('\n').split(/\s+/).slice(-OVERLAP_WORDS).join(' ');
      current = overlapText ? [overlapText] : [];
      currentWords = overlapText.split(/\s+/).length;
    }
    current.push(sentence);
    currentWords += words;
  }
  if (current.length) chunks.push(current.join('\n'));
  return chunks.length ? chunks : [''];
}
