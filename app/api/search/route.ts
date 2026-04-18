import { z } from 'zod';
import { badRequest, requireUser, unauthorized } from '@/lib/api-auth';
import { knowledgeIndex } from '@/lib/pinecone';
import { embedQuery } from '@/lib/embeddings';
import prisma from '@/prisma/client';
import type { IndexedChunkMeta } from '@/lib/knowledge-base';

const schema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(20).optional(),
  filter: z.object({
    authorId: z.string().optional(),
    plan: z.string().optional(),
    nodeCount: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  }).optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const vector = await embedQuery(parsed.data.query);
  const filter: Record<string, unknown> = { isPublished: { $eq: true } };
  if (parsed.data.filter?.authorId) filter.authorId = { $eq: parsed.data.filter.authorId };
  if (parsed.data.filter?.plan) filter.plan = { $eq: parsed.data.filter.plan };

  const result = await knowledgeIndex.query({
    vector,
    topK: parsed.data.topK ?? 10,
    filter,
    includeMetadata: true,
  });

  const byTree = new Map<string, { score: number; excerpt: string }>();
  for (const m of result.matches ?? []) {
    const meta = m.metadata as IndexedChunkMeta | undefined;
    if (!meta) continue;
    const prev = byTree.get(meta.treeId);
    const score = m.score ?? 0;
    if (!prev || prev.score < score) {
      byTree.set(meta.treeId, { score, excerpt: meta.chunkText });
    }
  }

  const treeIds = [...byTree.keys()];
  const trees = await prisma.metricTree.findMany({
    where: { id: { in: treeIds } },
    include: { _count: { select: { nodes: true } } },
  });

  const results = trees.map((t) => ({
    treeId: t.id,
    title: t.title,
    authorId: t.userId,
    score: byTree.get(t.id)?.score ?? 0,
    nodeCount: t._count.nodes,
    excerpt: byTree.get(t.id)?.excerpt ?? '',
  })).sort((a, b) => b.score - a.score);

  return Response.json({ results });
}
