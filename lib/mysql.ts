import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';
import { decryptSecret } from './crypto';
import { ensureLimit, validateReadOnly } from './sql-guard';

export interface DataSourceConnInput {
  host: string;
  port: number;
  database: string;
  username: string;
  passwordEnc: string;
  ssl: boolean;
}

const DEFAULT_QUERY_TIMEOUT_MS = 10_000;

function buildConfig(ds: DataSourceConnInput): PoolOptions {
  return {
    host: ds.host,
    port: ds.port,
    user: ds.username,
    password: decryptSecret(ds.passwordEnc),
    database: ds.database,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    ssl: ds.ssl ? { rejectUnauthorized: true } : undefined,
    connectTimeout: 5_000,
    // mysql2 doesn't have first-class query timeout on pool; we wrap below.
  };
}

// Tiny LRU cache so we don't spin up a new pool per request.
const pools = new Map<string, { pool: Pool; key: string }>();
const POOL_KEY = (ds: DataSourceConnInput) =>
  [ds.host, ds.port, ds.database, ds.username, ds.passwordEnc].join('|');

function getPool(id: string, ds: DataSourceConnInput): Pool {
  const key = POOL_KEY(ds);
  const cached = pools.get(id);
  if (cached && cached.key === key) return cached.pool;
  if (cached) cached.pool.end().catch(() => {});
  const pool = mysql.createPool(buildConfig(ds));
  pools.set(id, { pool, key });
  return pool;
}

export async function testConnection(ds: DataSourceConnInput): Promise<{ ok: true; version: string } | { ok: false; error: string }> {
  const conn = await mysql.createConnection(buildConfig(ds)).catch((e) => {
    throw e;
  });
  try {
    const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT VERSION() AS v');
    const version = String(rows[0]?.v ?? '');
    return { ok: true, version };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function runReadOnlyScalar(
  dataSourceId: string,
  ds: DataSourceConnInput,
  query: string,
  opts: { timeoutMs?: number } = {},
): Promise<{ ok: true; value: number | null; sampledAt: Date } | { ok: false; error: string }> {
  const guard = validateReadOnly(query);
  if (!guard.ok) return { ok: false, error: guard.error ?? 'query rejected' };
  const safe = ensureLimit(query, 1);
  const pool = getPool(dataSourceId, ds);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;

  try {
    const rowsP = pool.query<mysql.RowDataPacket[]>(safe);
    const rows = (await Promise.race([
      rowsP,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('query timeout')), timeoutMs)),
    ])) as Awaited<typeof rowsP>;
    const first = rows[0]?.[0];
    if (!first) return { ok: true, value: null, sampledAt: new Date() };
    const cols = Object.keys(first);
    const col = cols.find((c) => typeof (first as Record<string, unknown>)[c] === 'number') ?? cols[0];
    const raw = (first as Record<string, unknown>)[col];
    const num = typeof raw === 'number' ? raw : Number(raw);
    return { ok: true, value: Number.isFinite(num) ? num : null, sampledAt: new Date() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function disposeAll() {
  for (const { pool } of pools.values()) await pool.end().catch(() => {});
  pools.clear();
}
