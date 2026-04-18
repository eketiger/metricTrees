import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { deleteMetricTreeVectors, indexMetricTree, updateMetricTreeVectors } from '@/lib/knowledge-base';

export async function GET(_req: Request, { params }: { params: Promise<{ treeId: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId } = await params;
  const tree = await prisma.metricTree.findUnique({
    where: { id: treeId },
    include: { nodes: true },
  });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id && !tree.isPublic) return forbidden();
  return Response.json({ tree });
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isPublic: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ treeId: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId } = await params;
  const tree = await prisma.metricTree.findUnique({ where: { id: treeId } });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id) return forbidden();

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const wasPublished = tree.status === 'published';
  const willPublish = parsed.data.status === 'published';

  const updated = await prisma.metricTree.update({
    where: { id: tree.id },
    data: parsed.data,
  });

  if (!wasPublished && willPublish) {
    indexMetricTree(updated.id).catch((e) => console.error('indexing failed', e));
  } else if (wasPublished && parsed.data.status && parsed.data.status !== 'published') {
    deleteMetricTreeVectors(updated.id).catch((e) => console.error('deletion failed', e));
  } else if (wasPublished && willPublish) {
    updateMetricTreeVectors(updated.id).catch((e) => console.error('reindex failed', e));
  }

  return Response.json({ tree: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ treeId: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId } = await params;
  const tree = await prisma.metricTree.findUnique({ where: { id: treeId } });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id) return forbidden();

  await prisma.metricNode.deleteMany({ where: { treeId: tree.id } });
  await prisma.metricTree.delete({ where: { id: tree.id } });
  deleteMetricTreeVectors(tree.id).catch((e) => console.error('deletion failed', e));

  return Response.json({ ok: true });
}
