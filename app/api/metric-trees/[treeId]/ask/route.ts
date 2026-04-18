import { z } from 'zod';
import prisma from '@/prisma/client';
import { anthropic, CLAUDE_MODEL, DEFAULT_MAX_TOKENS } from '@/lib/anthropic';
import { retrieveRagChunks } from '@/lib/knowledge-base';
import { incrementAskUsage } from '@/lib/rate-limit';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { limitsFor } from '@/lib/plans';

const askSchema = z.object({
  question: z.string().min(1).max(500),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

const SYSTEM = `You are a helpful analyst answering questions about a specific metric tree — a structured hierarchy of business goals, KPIs, and sub-metrics. Answer ONLY based on the provided metric tree content and node data. If the answer is not found in the tree, say: "I couldn't find that in this metric tree." Be concise and analytical. Do not hallucinate metrics or values.`;

export async function POST(req: Request, { params }: { params: { treeId: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const tree = await prisma.metricTree.findUnique({ where: { id: params.treeId } });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id && !tree.isPublic) return forbidden();

  const parsed = askSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  const limits = limitsFor(user.subscriptionPlan);
  const usage = await incrementAskUsage(user.id, tree.id);
  if (usage > limits.askDailyRequestsPerTree) {
    return Response.json({ error: 'Daily Ask limit reached for this tree.' }, { status: 429 });
  }

  let ragContext = '';
  try {
    const chunks = await retrieveRagChunks(tree.id, parsed.data.question, 5);
    ragContext = chunks.map((c, i) => `[Chunk ${i + 1}]: ${c.text}`).join('\n\n');
  } catch {
    // If vector DB isn't available, fall back to tree metadata.
    const nodes = await prisma.metricNode.findMany({ where: { treeId: tree.id }, take: 50 });
    ragContext = `${tree.title}\n${tree.description ?? ''}\n\n${nodes
      .map((n) => `- [${n.metricType}] ${n.title}${n.description ? `: ${n.description}` : ''}`)
      .join('\n')}`;
  }

  const userMessage = `Relevant excerpts from this metric tree:\n\n${ragContext}\n\nQuestion: ${parsed.data.question}`;
  const messages = [
    ...(parsed.data.conversationHistory ?? []),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    const resp = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: SYSTEM,
      messages,
    });
    const answer = resp.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text)
      .join('\n');

    await prisma.treeAsk.create({
      data: { treeId: tree.id, userId: user.id, question: parsed.data.question, answer },
    });

    return Response.json({ answer });
  } catch (e) {
    const err = e as { status?: number };
    if (err.status === 429) {
      return Response.json({ error: 'AI features are temporarily busy. Please try again in a few seconds.' }, { status: 503 });
    }
    return Response.json({ error: 'AI service unavailable.' }, { status: 502 });
  }
}
