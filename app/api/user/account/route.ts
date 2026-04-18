import prisma from '@/prisma/client';
import { requireUser, unauthorized } from '@/lib/api-auth';
import { deleteMetricTreeVectors } from '@/lib/knowledge-base';

export async function DELETE() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const trees = await prisma.metricTree.findMany({ where: { userId: user.id }, select: { id: true } });
  for (const t of trees) {
    await deleteMetricTreeVectors(t.id).catch(() => {});
  }

  await prisma.$transaction([
    prisma.metricNode.deleteMany({ where: { tree: { userId: user.id } } }),
    prisma.treeAsk.deleteMany({ where: { userId: user.id } }),
    prisma.metricTree.deleteMany({ where: { userId: user.id } }),
    prisma.askUsage.deleteMany({ where: { userId: user.id } }),
    prisma.copilotUsage.deleteMany({ where: { userId: user.id } }),
    prisma.invoice.deleteMany({ where: { userId: user.id } }),
    prisma.subscription.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@example.invalid`,
        name: null,
        avatar: null,
        googleId: null,
        githubId: null,
        githubUsername: null,
        deletionRequestedAt: new Date(),
      },
    }),
  ]);

  return Response.json({ ok: true });
}
