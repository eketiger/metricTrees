import prisma from '@/prisma/client';
import { forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { testConnection } from '@/lib/mysql';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const ds = await prisma.dataSource.findUnique({ where: { id } });
  if (!ds) return notFound('Data source not found');
  if (ds.userId !== user.id) return forbidden();

  const t = await testConnection(ds);
  await prisma.dataSource.update({
    where: { id: ds.id },
    data: {
      status: t.ok ? 'connected' : 'error',
      lastTestAt: new Date(),
      lastError: t.ok ? null : t.error,
    },
  });
  return Response.json(t);
}
