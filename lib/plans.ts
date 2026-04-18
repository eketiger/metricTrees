export type Plan = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxTrees: number;
  maxNodesPerTree: number;
  copilotDailyRequests: number;
  askDailyRequestsPerTree: number;
  aiEnabled: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxTrees: 3,
    maxNodesPerTree: 20,
    copilotDailyRequests: 0,
    askDailyRequestsPerTree: 20,
    aiEnabled: false,
  },
  pro: {
    maxTrees: Infinity,
    maxNodesPerTree: Infinity,
    copilotDailyRequests: 50,
    askDailyRequestsPerTree: 20,
    aiEnabled: true,
  },
  enterprise: {
    maxTrees: Infinity,
    maxNodesPerTree: Infinity,
    copilotDailyRequests: Infinity,
    askDailyRequestsPerTree: Infinity,
    aiEnabled: true,
  },
};

export function normalizePlan(plan: string | null | undefined): Plan {
  if (plan === 'pro' || plan === 'enterprise') return plan;
  return 'free';
}

export function limitsFor(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[normalizePlan(plan)];
}

export function planRank(plan: Plan): number {
  return plan === 'enterprise' ? 2 : plan === 'pro' ? 1 : 0;
}

export function planQualifies(userPlan: string | null | undefined, required: Plan): boolean {
  return planRank(normalizePlan(userPlan)) >= planRank(required);
}
