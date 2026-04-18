import prisma from '@/prisma/client';
import { stripe } from '@/lib/stripe';
import { badRequest, requireUser, unauthorized } from '@/lib/api-auth';

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!user.subscriptionId) return badRequest('No active subscription.');

  await stripe.subscriptions.update(user.subscriptionId, { cancel_at_period_end: true });
  await prisma.user.update({
    where: { id: user.id },
    data: { cancelAtPeriodEnd: true },
  });
  return Response.json({ ok: true });
}
