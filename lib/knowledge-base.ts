import prisma from '@/prisma/client';
import { knowledgeIndex } from './pinecone';
import { embedBatch, embedQuery } from './embeddings';
import { chunkMetricTree, type ChunkableNode } from './chunker';

export interface IndexedChunkMeta extends Record<string, unknown> {
  treeId: string;
  chunkIndex: number;
  chunkText: string;
  authorId: string;
  isPublished: boolean;
  plan: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function indexMetricTree(treeId: string): Promise<void> {
  const tree = await prisma.metricTree.findUnique({
    where: { id: treeId },
    include: { nodes: true, user: true },
  });
  if (!tree) throw new Error(`tree not found: ${treeId}`);

  const nodes: ChunkableNode[] = tree.nodes.map((n) => ({
    title: n.title,
    description: n.description,
    metricType: n.metricType,
    unit: n.unit,
    targetValue: n.targetValue,
    currentValue: n.currentValue,
    formula: n.formula,
    depth: n.depth,
  }));

  const chunks = chunkMetricTree({ title: tree.title, description: tree.description }, nodes);
  const vectors = await embedBatch(chunks);

  const upserts = chunks.map((text, i) => ({
    id: `${treeId}_${i}`,
    values: vectors[i],
    metadata: {
      treeId,
      chunkIndex: i,
      chunkText: text.slice(0, 1000),
      authorId: tree.userId,
      isPublished: tree.status === 'published',
      plan: tree.user.subscriptionPlan ?? 'free',
      nodeCount: tree.nodes.length,
      createdAt: tree.createdAt.toISOString(),
      updatedAt: tree.updatedAt.toISOString(),
    } satisfies IndexedChunkMeta,
  }));

  await knowledgeIndex.upsert(upserts);

  await prisma.metricTree.update({
    where: { id: treeId },
    data: { vectorizedAt: new Date(), vectorStatus: 'indexed' },
  });
}

export async function deleteMetricTreeVectors(treeId: string): Promise<void> {
  await knowledgeIndex.deleteMany({ filter: { treeId: { $eq: treeId } } });
  await prisma.metricTree.update({
    where: { id: treeId },
    data: { vectorStatus: 'deleted' },
  });
}

export async function updateMetricTreeVectors(treeId: string): Promise<void> {
  await deleteMetricTreeVectors(treeId);
  await indexMetricTree(treeId);
}

export interface RagChunk {
  id: string;
  score: number;
  text: string;
}

export async function retrieveRagChunks(treeId: string, question: string, topK = 5): Promise<RagChunk[]> {
  const vector = await embedQuery(question);
  const result = await knowledgeIndex.query({
    vector,
    topK,
    filter: { treeId: { $eq: treeId } },
    includeMetadata: true,
  });
  return (result.matches ?? []).map((m) => ({
    id: m.id,
    score: m.score ?? 0,
    text: String((m.metadata as IndexedChunkMeta | undefined)?.chunkText ?? ''),
  }));
}
