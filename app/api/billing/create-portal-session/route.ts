import { stripe } from '@/lib/stripe';
import { badRequest, requireUser, unauthorized } from '@/lib/api-auth';

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!user.stripeCustomerId) return badRequest('No Stripe customer.');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL ?? ''}/billing`,
  });

  return Response.json({ url: session.url });
}
