import prisma from '@/prisma/client';
import { indexMetricTree } from '@/lib/knowledge-base';
import { forbidden, requireUser, unauthorized } from '@/lib/api-auth';

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const candidates = await prisma.metricTree.findMany({
    where: {
      status: 'published',
      OR: [{ vectorStatus: { not: 'indexed' } }, { vectorizedAt: null }],
    },
  });

  const errors: string[] = [];
  let processed = 0;
  for (let i = 0; i < candidates.length; i += 10) {
    const batch = candidates.slice(i, i + 10);
    for (const t of batch) {
      try {
        await indexMetricTree(t.id);
        processed += 1;
      } catch (e) {
        errors.push(`${t.id}: ${(e as Error).message}`);
      }
    }
  }

  return Response.json({ queued: candidates.length, processed, errors });
}
