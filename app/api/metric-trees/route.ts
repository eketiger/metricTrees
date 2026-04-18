import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, requireUser, unauthorized } from '@/lib/api-auth';
import { limitsFor } from '@/lib/plans';

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const trees = await prisma.metricTree.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { nodes: true } } },
  });
  return Response.json({
    trees: trees.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      isPublic: t.isPublic,
      nodeCount: t._count.nodes,
      updatedAt: t.updatedAt,
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const limits = limitsFor(user.subscriptionPlan);
  const count = await prisma.metricTree.count({ where: { userId: user.id } });
  if (count >= limits.maxTrees) {
    return Response.json({ error: 'Plan limit reached: upgrade to Pro for unlimited trees.' }, { status: 402 });
  }

  const tree = await prisma.metricTree.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });
  return Response.json({ tree }, { status: 201 });
}
