import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { encryptSecret } from '@/lib/crypto';
import { testConnection } from '@/lib/mysql';

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  host: z.string().min(1).max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(1).max(120).optional(),
  username: z.string().min(1).max(120).optional(),
  password: z.string().min(1).max(1024).optional(),
  ssl: z.boolean().optional(),
  retest: z.boolean().default(false),
});

function redact<T extends { passwordEnc?: string }>(ds: T): Omit<T, 'passwordEnc'> {
  const { passwordEnc: _drop, ...rest } = ds;
  return rest;
}

async function loadOwned(id: string, userId: string) {
  const ds = await prisma.dataSource.findUnique({ where: { id } });
  if (!ds) return { err: notFound('Data source not found') };
  if (ds.userId !== userId) return { err: forbidden() };
  return { ds };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const { ds, err } = await loadOwned(id, user.id);
  if (err) return err;
  return Response.json({ dataSource: redact(ds!) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const { ds, err } = await loadOwned(id, user.id);
  if (err) return err;

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const data: Record<string, unknown> = {};
  for (const k of ['name', 'host', 'port', 'database', 'username', 'ssl'] as const) {
    if (parsed.data[k] != null) data[k] = parsed.data[k];
  }
  if (parsed.data.password) {
    data.passwordEnc = encryptSecret(parsed.data.password);
  }

  if (parsed.data.retest) {
    const merged = {
      host: (data.host as string | undefined) ?? ds!.host,
      port: (data.port as number | undefined) ?? ds!.port,
      database: (data.database as string | undefined) ?? ds!.database,
      username: (data.username as string | undefined) ?? ds!.username,
      passwordEnc: (data.passwordEnc as string | undefined) ?? ds!.passwordEnc,
      ssl: (data.ssl as boolean | undefined) ?? ds!.ssl,
    };
    const t = await testConnection(merged);
    if (!t.ok) return Response.json({ error: `Connection failed: ${t.error}` }, { status: 422 });
    data.status = 'connected';
    data.lastTestAt = new Date();
    data.lastError = null;
  }

  const updated = await prisma.dataSource.update({ where: { id: ds!.id }, data });
  return Response.json({ dataSource: redact(updated) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const { ds, err } = await loadOwned(id, user.id);
  if (err) return err;

  // Un-link from any nodes but keep the node history.
  await prisma.metricNode.updateMany({
    where: { dataSourceId: ds!.id },
    data: { dataSourceId: null, query: null },
  });
  await prisma.dataSource.delete({ where: { id: ds!.id } });
  return Response.json({ ok: true });
}
