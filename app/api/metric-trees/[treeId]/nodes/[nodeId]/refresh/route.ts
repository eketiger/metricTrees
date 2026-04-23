import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { runReadOnlyScalar } from '@/lib/mysql';

const bodySchema = z.object({
  query: z.string().min(1).max(10_000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ treeId: string; nodeId: string }> },
) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId, nodeId } = await params;

  const node = await prisma.metricNode.findUnique({
    where: { id: nodeId },
    include: { tree: true, dataSource: true },
  });
  if (!node || node.treeId !== treeId) return notFound('Node not found');
  if (node.tree.userId !== user.id) return forbidden();
  if (!node.dataSource) return badRequest('Node has no data source configured');

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');
  const query = parsed.data.query ?? node.query;
  if (!query) return badRequest('Node has no query configured');

  // Persist the query if caller passed a new one.
  if (parsed.data.query && parsed.data.query !== node.query) {
    await prisma.metricNode.update({ where: { id: node.id }, data: { query } });
  }

  const result = await runReadOnlyScalar(node.dataSource.id, node.dataSource, query);
  if (!result.ok) {
    await prisma.metricNode.update({
      where: { id: node.id },
      data: { lastSyncError: result.error, lastSyncAt: new Date() },
    });
    return Response.json({ ok: false, error: result.error }, { status: 422 });
  }

  const updated = await prisma.metricNode.update({
    where: { id: node.id },
    data: {
      currentValue: result.value,
      lastSyncAt: result.sampledAt,
      lastSyncError: null,
    },
  });

  return Response.json({
    ok: true,
    value: result.value,
    sampledAt: result.sampledAt,
    node: {
      id: updated.id,
      currentValue: updated.currentValue,
      lastSyncAt: updated.lastSyncAt,
    },
  });
}
