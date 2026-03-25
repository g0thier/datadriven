import { PLANS } from "../constants/managementPlans.js";

/**
 * @module utils/subscriptionCapacity
 * @description Capacity and role-limit helpers for company subscriptions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

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

/**
 * Normalizes a plan key to the internal canonical format.
 * @param {string} [planKey=""] - Raw plan key.
 * @returns {string} Normalized plan key.
 */
function normalizePlanKey(planKey = "") {
  return String(planKey || "").trim().toLowerCase();
}

/**
 * Resolves the company plan key from top-level or billing data.
 * @param {Object} [companyData={}] - Company payload.
 * @returns {string} Normalized plan key.
 */
export function resolveCompanyPlanKey(companyData = {}) {
  return normalizePlanKey(companyData?.plan || companyData?.billing?.planKey || "");
}

/**
 * Aggregates active employees by role.
 * @param {Object<string, Object>} [companyEmployees={}] - Employee map.
 * @returns {{owner:number, leader:number, colab:number}} Role counts.
 */
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

/**
 * Resolves plan role limits for a given plan key.
 * @param {string} [planKey=""] - Plan key.
 * @returns {{ownerLimit:number, leaderLimit:number, colabLimit:number}} Role limits.
 */
export function resolvePlanRoleLimits(planKey = "") {
  const normalizedPlanKey = normalizePlanKey(planKey);
  if (!normalizedPlanKey) return { ...DEFAULT_PLAN_LIMITS };

  const limits = PLAN_LIMITS_BY_KEY[normalizedPlanKey] || DEFAULT_PLAN_LIMITS;
  return { ...limits };
}

/**
 * Checks whether a role count exceeds its plan limit.
 * @param {number} currentValue - Current number of users for the role.
 * @param {number} limitValue - Maximum allowed users for the role.
 * @returns {boolean} `true` when over limit.
 */
export function isRoleCountOverLimit(currentValue, limitValue) {
  const numericLimit = Number(limitValue || 0);
  return Number(currentValue || 0) > numericLimit;
}

/**
 * Indicates whether a company only has one active owner and no other roles.
 * @param {Object} [companyRoleCounts={}] - Role counts.
 * @param {number} [companyRoleCounts.owner] - Owner count.
 * @param {number} [companyRoleCounts.leader] - Leader count.
 * @param {number} [companyRoleCounts.colab] - Collaborator count.
 * @returns {boolean} Whether the company is owner-only.
 */
export function isOwnerOnlyCompany(companyRoleCounts = {}) {
  const ownerCount = Number(companyRoleCounts?.owner || 0);
  const leaderCount = Number(companyRoleCounts?.leader || 0);
  const colabCount = Number(companyRoleCounts?.colab || 0);

  return ownerCount === 1 && leaderCount === 0 && colabCount === 0;
}

/**
 * Computes subscription capacity status for company roles.
 * @param {Object} [companyData={}] - Company payload including plan and employees.
 * @returns {Object} Capacity details.
 */
export function getCompanySubscriptionCapacity(companyData = {}) {
  const planKey = resolveCompanyPlanKey(companyData);
  const companyRoleCounts = buildCompanyRoleCounts(companyData?.employees || {});
  const { ownerLimit, leaderLimit, colabLimit } = resolvePlanRoleLimits(planKey);

  const isOwnerOnly = isOwnerOnlyCompany(companyRoleCounts);

  const rawOwnerOverCapacity = isRoleCountOverLimit(
    companyRoleCounts.owner,
    ownerLimit
  );
  const rawLeaderOverCapacity = isRoleCountOverLimit(
    companyRoleCounts.leader,
    leaderLimit
  );
  const rawColabOverCapacity = isRoleCountOverLimit(
    companyRoleCounts.colab,
    colabLimit
  );

  const isOwnerOverCapacity = isOwnerOnly ? false : rawOwnerOverCapacity;
  const isLeaderOverCapacity = isOwnerOnly ? false : rawLeaderOverCapacity;
  const isColabOverCapacity = isOwnerOnly ? false : rawColabOverCapacity;
  const isOverCapacity =
    isOwnerOverCapacity || isLeaderOverCapacity || isColabOverCapacity;

  return {
    planKey,
    companyRoleCounts,
    ownerLimit,
    leaderLimit,
    colabLimit,
    isOwnerOnlyCompany: isOwnerOnly,
    isOwnerOverCapacity,
    isLeaderOverCapacity,
    isColabOverCapacity,
    isOverCapacity,
  };
}
