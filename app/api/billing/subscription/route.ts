import { requireUser, unauthorized } from '@/lib/api-auth';

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  return Response.json({
    plan: user.subscriptionPlan ?? 'free',
    status: user.subscriptionStatus ?? null,
    currentPeriodEnd: user.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
  });
}
