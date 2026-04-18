import { chunkMetricTree, serializeTree } from '@/lib/chunker';

const tree = { title: 'Revenue tree', description: 'North-star tree' };
const nodes = [
  { title: 'Revenue', metricType: 'output', depth: 0, unit: '$', targetValue: 1000, currentValue: 900, formula: 'a + b' },
  { title: 'Users', metricType: 'input', depth: 1, currentValue: 10 },
];

describe('serializeTree', () => {
  it('emits a header and one line per node', () => {
    const out = serializeTree(tree, nodes);
    expect(out[0]).toContain('Revenue tree');
    expect(out[1]).toContain('[depth-0] Revenue (output)');
    expect(out[1]).toContain('Target: 1000 $');
    expect(out[1]).toContain('Current: 900 $');
    expect(out[1]).toContain('Formula: a + b');
    expect(out[2]).toContain('[depth-1] Users (input)');
  });
});

describe('chunkMetricTree', () => {
  it('returns at least one chunk for any tree', () => {
    expect(chunkMetricTree(tree, nodes).length).toBeGreaterThan(0);
  });
  it('returns empty string chunk for empty tree', () => {
    expect(chunkMetricTree({ title: '' }, [])).toEqual(['']);
  });
  it('chunks when word count exceeds target', () => {
    const big = Array.from({ length: 100 }, (_, i) => ({
      title: 'X'.repeat(20) + ' ' + 'y'.repeat(20) + ' ' + 'z'.repeat(20) + ' #' + i,
      metricType: 'input',
      depth: 0,
    }));
    const chunks = chunkMetricTree({ title: 'Big' }, big);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
