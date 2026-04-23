import { z } from 'zod';
import prisma from '@/prisma/client';
import { badRequest, requireUser, unauthorized } from '@/lib/api-auth';
import { encryptSecret } from '@/lib/crypto';
import { testConnection } from '@/lib/mysql';

const basicSchema = z.object({
  mode: z.literal('basic').default('basic'),
  name: z.string().min(1).max(120),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535).default(3306),
  database: z.string().min(1).max(120),
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(1024),
  ssl: z.boolean().default(true),
  testOnSave: z.boolean().default(true),
});

const urlSchema = z.object({
  mode: z.literal('url'),
  name: z.string().min(1).max(120),
  url: z.string().min(1).max(1024),
  ssl: z.boolean().default(true),
  testOnSave: z.boolean().default(true),
});

const createSchema = z.union([basicSchema, urlSchema]);

function parseJdbcOrUrl(raw: string) {
  // Accept mysql://, mysql2://, or jdbc:mysql:// prefixes.
  const trimmed = raw.replace(/^jdbc:/, '');
  const u = new URL(trimmed);
  if (!/^mysql2?:$/.test(u.protocol)) throw new Error('only mysql URLs are supported');
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  };
}

function redact<T extends { passwordEnc?: string }>(ds: T): Omit<T, 'passwordEnc'> {
  const { passwordEnc: _drop, ...rest } = ds;
  return rest;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  const rows = await prisma.dataSource.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json({ dataSources: rows.map(redact) });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  let host: string, port: number, database: string, username: string, password: string;
  if (parsed.data.mode === 'url') {
    try {
      const parts = parseJdbcOrUrl(parsed.data.url);
      host = parts.host; port = parts.port; database = parts.database;
      username = parts.username; password = parts.password;
    } catch (e) {
      return badRequest(`Invalid URL: ${(e as Error).message}`);
    }
  } else {
    host = parsed.data.host; port = parsed.data.port; database = parsed.data.database;
    username = parsed.data.username; password = parsed.data.password;
  }

  const { name, ssl, testOnSave } = parsed.data;
  const passwordEnc = encryptSecret(password);

  if (testOnSave) {
    const t = await testConnection({ host, port, database, username, passwordEnc, ssl });
    if (!t.ok) return Response.json({ error: `Connection failed: ${t.error}` }, { status: 422 });
  }

  const created = await prisma.dataSource.create({
    data: {
      userId: user.id,
      name,
      type: 'mysql',
      host,
      port,
      database,
      username,
      passwordEnc,
      ssl,
      status: testOnSave ? 'connected' : 'idle',
      lastTestAt: testOnSave ? new Date() : null,
    },
  });

  return Response.json({ dataSource: redact(created) }, { status: 201 });
}
