import prisma from '@/prisma/client';
import { knowledgeIndex } from '@/lib/pinecone';
import type { IndexedChunkMeta } from '@/lib/knowledge-base';
import { notFound } from '@/lib/api-auth';

export async function GET(_req: Request, { params }: { params: Promise<{ treeId: string }> }) {
  const { treeId } = await params;
  const tree = await prisma.metricTree.findUnique({ where: { id: treeId } });
  if (!tree) return notFound('Tree not found');

  const seedId = `${tree.id}_0`;
  const fetched = await knowledgeIndex.fetch([seedId]);
  const vector = fetched.records?.[seedId]?.values;
  if (!vector) return Response.json({ results: [] });

  const query = await knowledgeIndex.query({
    vector,
    topK: 11,
    filter: { isPublished: { $eq: true } },
    includeMetadata: true,
  });

  const byTree = new Map<string, number>();
  for (const m of query.matches ?? []) {
    const meta = m.metadata as IndexedChunkMeta | undefined;
    if (!meta || meta.treeId === tree.id) continue;
    const existing = byTree.get(meta.treeId) ?? 0;
    if (m.score && m.score > existing) byTree.set(meta.treeId, m.score);
  }

  const topIds = [...byTree.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  const trees = await prisma.metricTree.findMany({
    where: { id: { in: topIds } },
    include: { _count: { select: { nodes: true } } },
  });

  return Response.json({
    results: trees.map((t) => ({
      treeId: t.id,
      title: t.title,
      nodeCount: t._count.nodes,
      score: byTree.get(t.id) ?? 0,
    })),
  });
}
