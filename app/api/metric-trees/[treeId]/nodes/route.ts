import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { limitsFor } from '@/lib/plans';

const createSchema = z.object({
  parentId: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  metricType: z.enum(['goal', 'kpi', 'input', 'output', 'diagnostic']),
  unit: z.string().max(40).optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  formula: z.string().max(2000).optional(),
  depth: z.number().int().min(0).max(20).optional(),
  order: z.number().int().min(0).optional(),
});

export async function POST(req: Request, { params }: { params: { treeId: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const tree = await prisma.metricTree.findUnique({ where: { id: params.treeId } });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id) return forbidden();

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const limits = limitsFor(user.subscriptionPlan);
  const count = await prisma.metricNode.count({ where: { treeId: tree.id } });
  if (count >= limits.maxNodesPerTree) {
    return Response.json({ error: 'Node limit reached for your plan.' }, { status: 402 });
  }

  const node = await prisma.metricNode.create({
    data: {
      treeId: tree.id,
      parentId: parsed.data.parentId ?? null,
      title: parsed.data.title,
      description: parsed.data.description,
      metricType: parsed.data.metricType,
      unit: parsed.data.unit,
      targetValue: parsed.data.targetValue,
      currentValue: parsed.data.currentValue,
      formula: parsed.data.formula,
      depth: parsed.data.depth ?? 0,
      order: parsed.data.order ?? 0,
    },
  });
  return Response.json({ node }, { status: 201 });
}
