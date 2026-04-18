import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import prisma from '@/prisma/client';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export function unauthorized(msg = 'Unauthorized') {
  return Response.json({ error: msg }, { status: 401 });
}

export function forbidden(msg = 'Forbidden') {
  return Response.json({ error: msg }, { status: 403 });
}

export function badRequest(msg = 'Bad request') {
  return Response.json({ error: msg }, { status: 400 });
}

export function notFound(msg = 'Not found') {
  return Response.json({ error: msg }, { status: 404 });
}
