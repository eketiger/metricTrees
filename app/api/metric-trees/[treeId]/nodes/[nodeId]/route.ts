import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  metricType: z.enum(['goal', 'kpi', 'input', 'output', 'diagnostic']).optional(),
  unit: z.string().max(40).optional(),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  formula: z.string().max(2000).nullable().optional(),
  depth: z.number().int().min(0).max(20).optional(),
  order: z.number().int().min(0).optional(),
});

async function loadAuthorized(treeId: string, nodeId: string, userId: string) {
  const node = await prisma.metricNode.findUnique({ where: { id: nodeId }, include: { tree: true } });
  if (!node || node.treeId !== treeId) return { err: notFound('Node not found') };
  if (node.tree.userId !== userId) return { err: forbidden() };
  return { node };
}

export async function PUT(req: Request, { params }: { params: Promise<{ treeId: string; nodeId: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId, nodeId } = await params;
  const { node, err } = await loadAuthorized(treeId, nodeId, user.id);
  if (err) return err;

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const updated = await prisma.metricNode.update({ where: { id: node!.id }, data: parsed.data });
  return Response.json({ node: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ treeId: string; nodeId: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId, nodeId } = await params;
  const { node, err } = await loadAuthorized(treeId, nodeId, user.id);
  if (err) return err;
  await prisma.metricNode.delete({ where: { id: node!.id } });
  return Response.json({ ok: true });
}
