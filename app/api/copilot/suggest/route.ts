import { z } from 'zod';
import prisma from '@/prisma/client';
import { anthropic, CLAUDE_MODEL, DEFAULT_MAX_TOKENS } from '@/lib/anthropic';
import { incrementCopilotUsage } from '@/lib/rate-limit';
import { badRequest, forbidden, notFound, requireUser, unauthorized } from '@/lib/api-auth';
import { limitsFor, planQualifies } from '@/lib/plans';

const schema = z.object({
  treeId: z.string(),
  nodeId: z.string().optional(),
  action: z.enum([
    'improve_description',
    'suggest_children',
    'suggest_formula',
    'explain_metric',
    'validate_tree',
    'suggest_kpis',
    'fix_structure',
  ]),
  selectedText: z.string().max(4000).default(''),
  context: z.string().max(4000).optional(),
  nodeType: z.string().optional(),
});

const SYSTEM = `You are a metric tree design copilot embedded in a business intelligence platform. You assist Builders (metric tree authors) in designing rigorous, well-structured metric trees that connect high-level business goals to granular KPIs. Be concise, precise, and analytically rigorous. Use standard business and data terminology. Respond ONLY with the improved or suggested content — no explanations, no preamble, no markdown wrappers.`;

function prompt(action: string, selectedText: string, context: string, nodeType?: string) {
  switch (action) {
    case 'improve_description':
      return `Improve this metric description. Make it clearer, more specific, and actionable:\n\n${selectedText}`;
    case 'suggest_children':
      return `Suggest 3-5 child metrics that would decompose this ${nodeType ?? 'metric'}. Output as a plain bullet list:\n\n${selectedText}`;
    case 'suggest_formula':
      return `Suggest a formula (using referenced slugs) for this metric:\n\n${selectedText}\n\nContext: ${context ?? ''}`;
    case 'explain_metric':
      return `Explain this metric in 2-3 sentences:\n\n${selectedText}`;
    case 'validate_tree':
      return `Validate the structure of this tree and list any gaps or redundancies as a bullet list:\n\n${context ?? selectedText}`;
    case 'suggest_kpis':
      return `Suggest 3 KPIs that measure progress against this goal. One bullet each:\n\n${selectedText}`;
    case 'fix_structure':
      return `Suggest concrete structural improvements to the tree below. Bullet list:\n\n${context ?? selectedText}`;
    default:
      return selectedText;
  }
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest('Invalid body');

  if (!planQualifies(user.subscriptionPlan, 'pro')) {
    return forbidden('Copilot requires a Pro or Enterprise plan.');
  }

  const tree = await prisma.metricTree.findUnique({ where: { id: parsed.data.treeId } });
  if (!tree) return notFound('Tree not found');
  if (tree.userId !== user.id) return forbidden();

  const limits = limitsFor(user.subscriptionPlan);
  const usage = await incrementCopilotUsage(user.id);
  if (usage > limits.copilotDailyRequests) {
    return Response.json(
      { error: 'Daily Copilot limit reached. Upgrade to Enterprise for unlimited access.' },
      { status: 429 },
    );
  }

  try {
    const resp = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: prompt(parsed.data.action, parsed.data.selectedText, parsed.data.context ?? '', parsed.data.nodeType),
      }],
    });
    const suggestion = resp.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text)
      .join('\n');
    return Response.json({ suggestion });
  } catch (e) {
    const err = e as { status?: number };
    if (err.status === 429) return Response.json({ error: 'AI features are temporarily busy.' }, { status: 503 });
    return Response.json({ error: 'AI service unavailable.' }, { status: 502 });
  }
}
