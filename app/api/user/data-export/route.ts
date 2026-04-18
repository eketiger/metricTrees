import prisma from '@/prisma/client';
import { requireUser, unauthorized } from '@/lib/api-auth';

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const trees = await prisma.metricTree.findMany({
    where: { userId: user.id },
    include: { nodes: true },
  });
  const invoices = await prisma.invoice.findMany({ where: { userId: user.id } });
  const subscriptions = await prisma.subscription.findMany({ where: { userId: user.id } });

  await prisma.user.update({
    where: { id: user.id },
    data: { dataExportRequestedAt: new Date() },
  });

  const body = JSON.stringify({ user, trees, invoices, subscriptions }, null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="metrics-data-export-${user.id}.json"`,
    },
  });
}
