import type { Stripe } from 'stripe';
import prisma from '@/prisma/client';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';

export const runtime = 'nodejs';

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (!customerId || !subscriptionId) return;
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionId, subscriptionStatus: 'active', subscriptionPlan: 'pro' },
      });
      return;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) return;
      const status = sub.status;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: status,
          subscriptionPlan: status === 'canceled' ? 'free' : user.subscriptionPlan ?? 'pro',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      return;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) return;
      await prisma.invoice.create({
        data: {
          userId: user.id,
          stripeInvoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status ?? 'paid',
          invoicePdf: invoice.invoice_pdf ?? null,
        },
      });
      return;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) return;
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'past_due' } });
      return;
    }
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response('invalid signature', { status: 400 });
  }

  handleEvent(event).catch((e) => console.error('webhook handler failed', e));
  return new Response('ok', { status: 200 });
}
