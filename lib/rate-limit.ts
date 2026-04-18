import prisma from '@/prisma/client';

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function incrementCopilotUsage(userId: string): Promise<number> {
  const date = today();
  const row = await prisma.copilotUsage.upsert({
    where: { userId_date: { userId, date } },
    update: { count: { increment: 1 } },
    create: { userId, date, count: 1 },
  });
  return row.count;
}

export async function incrementAskUsage(userId: string, treeId: string): Promise<number> {
  const date = today();
  const row = await prisma.askUsage.upsert({
    where: { userId_treeId_date: { userId, treeId, date } },
    update: { count: { increment: 1 } },
    create: { userId, treeId, date, count: 1 },
  });
  return row.count;
}
