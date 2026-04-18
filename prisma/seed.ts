import prisma from './client';

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'builder@example.com' },
    update: {},
    create: {
      email: 'builder@example.com',
      name: 'Demo Builder',
      authProvider: 'email',
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      gdprConsentAt: new Date(),
      gdprConsentVersion: '1.0',
    },
  });

  const published = await prisma.metricTree.create({
    data: {
      userId: user.id,
      title: 'Company KPI Tree',
      description: 'North-star revenue tree mapping CSAT, Engagement, and ARPU.',
      status: 'published',
      isPublic: true,
    },
  });

  const revenue = await prisma.metricNode.create({
    data: {
      treeId: published.id,
      title: 'Increase Revenue',
      metricType: 'goal',
      unit: '$',
      targetValue: 2_800_000,
      currentValue: 2_320_000,
      formula: 'csat_driver + engagement_driver + arpu_driver',
      depth: 0,
      order: 0,
    },
  });

  await prisma.metricNode.createMany({
    data: [
      { treeId: published.id, parentId: revenue.id, title: 'Customer Satisfaction', metricType: 'kpi', unit: 'NPS', currentValue: 42.4, depth: 1, order: 0 },
      { treeId: published.id, parentId: revenue.id, title: 'Engagement', metricType: 'kpi', unit: 'Content/MAU', currentValue: 12.4, depth: 1, order: 1 },
      { treeId: published.id, parentId: revenue.id, title: 'ARPU', metricType: 'kpi', unit: '$', currentValue: 2.42, formula: 'revenue / paying_users', depth: 1, order: 2 },
      { treeId: published.id, parentId: revenue.id, title: '30 Day Retention', metricType: 'input', unit: '%', currentValue: 0.142, depth: 2, order: 0 },
      { treeId: published.id, parentId: revenue.id, title: 'Total Subscriptions', metricType: 'input', unit: 'count', currentValue: 13200, depth: 2, order: 1 },
    ],
  });

  await prisma.metricTree.create({
    data: {
      userId: user.id,
      title: 'AARRR Funnel',
      description: 'Pirate metrics draft.',
      status: 'draft',
    },
  });

  await prisma.metricTree.create({
    data: {
      userId: user.id,
      title: 'Old Growth Tree',
      description: 'Archived.',
      status: 'archived',
    },
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
