import prisma from '@/prisma/client';
import { forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { runReadOnlyScalar } from '@/lib/mysql';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POLL_MS = 5_000;
const MAX_LIFETIME_MS = 10 * 60_000; // drop the stream after 10 minutes; client reconnects

function sse(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ treeId: string }> },
) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const { treeId } = await params;

  const tree = await prisma.metricTree.findUnique({ where: { id: treeId } });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id && !tree.isPublic) return forbidden();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const started = Date.now();
      const lastValues = new Map<string, number | null>();
      let closed = false;

      req.signal.addEventListener('abort', () => {
        closed = true;
      });

      controller.enqueue(sse('hello', { treeId, pollMs: POLL_MS }));

      const poll = async () => {
        if (closed) return;
        if (Date.now() - started > MAX_LIFETIME_MS) {
          controller.enqueue(sse('bye', { reason: 'max_lifetime' }));
          controller.close();
          return;
        }

        const nodes = await prisma.metricNode.findMany({
          where: { treeId, dataSourceId: { not: null }, query: { not: null } },
          include: { dataSource: true },
        });

        for (const n of nodes) {
          if (closed || !n.dataSource || !n.query) continue;
          const res = await runReadOnlyScalar(n.dataSource.id, n.dataSource, n.query, { timeoutMs: 4_000 });
          if (!res.ok) {
            controller.enqueue(sse('node_error', { nodeId: n.id, error: res.error }));
            continue;
          }
          const prev = lastValues.get(n.id);
          if (prev !== res.value) {
            lastValues.set(n.id, res.value);
            await prisma.metricNode.update({
              where: { id: n.id },
              data: { currentValue: res.value, lastSyncAt: res.sampledAt, lastSyncError: null },
            }).catch(() => {});
            controller.enqueue(sse('node_value', {
              nodeId: n.id,
              value: res.value,
              sampledAt: res.sampledAt,
            }));
          }
        }

        if (!closed) setTimeout(poll, POLL_MS);
      };

      poll().catch((e) => {
        controller.enqueue(sse('error', { message: (e as Error).message }));
        controller.close();
      });
    },
    cancel() {
      // handled via req.signal
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
