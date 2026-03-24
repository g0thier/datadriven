import { PLANS } from "../constants/managementPlans.js";

const DEFAULT_ROLE_COUNTS = Object.freeze({
  owner: 0,
  leader: 0,
  colab: 0,
});

const DEFAULT_PLAN_LIMITS = Object.freeze({
  ownerLimit: 0,
  leaderLimit: 0,
  colabLimit: 0,
});

const PLAN_LIMITS_BY_KEY = Object.freeze(
  (PLANS || []).reduce((accumulator, plan) => {
    const key = String(plan?.name || "").trim().toLowerCase();
    if (!key) return accumulator;

    accumulator[key] = {
      ownerLimit: Number(plan?.owner || 0),
      leaderLimit: Number(plan?.leader || 0),
      colabLimit: Number(plan?.colab || 0),
    };

    return accumulator;
  }, {})
);

function normalizePlanKey(planKey = "") {
  return String(planKey || "").trim().toLowerCase();
}

export function resolveCompanyPlanKey(companyData = {}) {
  return normalizePlanKey(companyData?.plan || companyData?.billing?.planKey || "");
}

export function buildCompanyRoleCounts(companyEmployees = {}) {
  if (!companyEmployees || typeof companyEmployees !== "object") {
    return { ...DEFAULT_ROLE_COUNTS };
  }

  const counts = {
    owner: 0,
    leader: 0,
    colab: 0,
  };

  Object.values(companyEmployees).forEach((employeeData) => {
    if (!employeeData || typeof employeeData !== "object") return;
    if (employeeData.isActive === false) return;

    const role = String(employeeData.role || "").trim().toLowerCase();
    if (role === "owner") {
      counts.owner += 1;
      return;
    }

    if (role === "leader") {
      counts.leader += 1;
      return;
    }

    if (role === "colab") {
      counts.colab += 1;
    }
  });

  return counts;
}

export function resolvePlanRoleLimits(planKey = "") {
  const normalizedPlanKey = normalizePlanKey(planKey);
  if (!normalizedPlanKey) return { ...DEFAULT_PLAN_LIMITS };

  const limits = PLAN_LIMITS_BY_KEY[normalizedPlanKey] || DEFAULT_PLAN_LIMITS;
  return { ...limits };
}

export function isRoleCountOverLimit(currentValue, limitValue) {
  const numericLimit = Number(limitValue || 0);
  return Number(currentValue || 0) > numericLimit;
}

export function getCompanySubscriptionCapacity(companyData = {}) {
  const planKey = resolveCompanyPlanKey(companyData);
  const companyRoleCounts = buildCompanyRoleCounts(companyData?.employees || {});
  const { ownerLimit, leaderLimit, colabLimit } = resolvePlanRoleLimits(planKey);

  const isOwnerOverCapacity = isRoleCountOverLimit(companyRoleCounts.owner, ownerLimit);
  const isLeaderOverCapacity = isRoleCountOverLimit(companyRoleCounts.leader, leaderLimit);
  const isColabOverCapacity = isRoleCountOverLimit(companyRoleCounts.colab, colabLimit);

  return {
    planKey,
    companyRoleCounts,
    ownerLimit,
    leaderLimit,
    colabLimit,
    isOwnerOverCapacity,
    isLeaderOverCapacity,
    isColabOverCapacity,
    isOverCapacity:
      isOwnerOverCapacity || isLeaderOverCapacity || isColabOverCapacity,
  };
}
