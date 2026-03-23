const { getAdminDatabase } = require("./firebaseAdmin");

function toIsoFromUnixSeconds(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
  return new Date(numericValue * 1000).toISOString();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLowerText(value) {
  return normalizeText(value).toLowerCase();
}

async function writeCompanyBilling(companyId, patch = {}, options = {}) {
  const normalizedCompanyId = normalizeText(companyId);
  if (!normalizedCompanyId) return;

  const normalizedPlanKey = normalizeLowerText(options.planKey);
  const normalizedStatus = normalizeLowerText(options.status);
  const now = new Date().toISOString();
  const updates = {
    [`companies/${normalizedCompanyId}/billing/provider`]: "stripe",
    [`companies/${normalizedCompanyId}/billing/updatedAt`]: now,
  };

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) return;
    updates[`companies/${normalizedCompanyId}/billing/${key}`] = value;
  });

  if (normalizedPlanKey) {
    updates[`companies/${normalizedCompanyId}/plan`] = normalizedPlanKey;
  }

  if (normalizedStatus) {
    updates[`companies/${normalizedCompanyId}/status`] = normalizedStatus;
  }

  await getAdminDatabase().ref().update(updates);
}

async function linkStripeCustomerToCompany(customerId, companyId) {
  const normalizedCustomerId = normalizeText(customerId);
  const normalizedCompanyId = normalizeText(companyId);
  if (!normalizedCustomerId || !normalizedCompanyId) return;

  await getAdminDatabase().ref(`stripe/customers/${normalizedCustomerId}`).update({
    companyId: normalizedCompanyId,
    updatedAt: new Date().toISOString(),
  });
}

async function linkStripeSubscriptionToCompany(subscriptionId, companyId) {
  const normalizedSubscriptionId = normalizeText(subscriptionId);
  const normalizedCompanyId = normalizeText(companyId);
  if (!normalizedSubscriptionId || !normalizedCompanyId) return;

  await getAdminDatabase().ref(`stripe/subscriptions/${normalizedSubscriptionId}`).update({
    companyId: normalizedCompanyId,
    updatedAt: new Date().toISOString(),
  });
}

async function resolveCompanyIdFromCustomer(customerId) {
  const normalizedCustomerId = normalizeText(customerId);
  if (!normalizedCustomerId) return "";

  const snapshot = await getAdminDatabase()
      .ref(`stripe/customers/${normalizedCustomerId}/companyId`)
      .get();

  return normalizeText(snapshot.exists() ? snapshot.val() : "");
}

async function resolveCompanyIdFromSubscription(subscriptionId) {
  const normalizedSubscriptionId = normalizeText(subscriptionId);
  if (!normalizedSubscriptionId) return "";

  const snapshot = await getAdminDatabase()
      .ref(`stripe/subscriptions/${normalizedSubscriptionId}/companyId`)
      .get();

  return normalizeText(snapshot.exists() ? snapshot.val() : "");
}

async function getCompanyBillingSnapshot(companyId) {
  const normalizedCompanyId = normalizeText(companyId);
  if (!normalizedCompanyId) return {};

  const snapshot = await getAdminDatabase().ref(`companies/${normalizedCompanyId}/billing`).get();
  return snapshot.exists() ? snapshot.val() || {} : {};
}

async function readStripeEvent(eventId) {
  const normalizedEventId = normalizeText(eventId);
  if (!normalizedEventId) return null;

  const snapshot = await getAdminDatabase().ref(`stripe/events/${normalizedEventId}`).get();
  return snapshot.exists() ? snapshot.val() || {} : null;
}

async function upsertStripeEvent(eventId, patch = {}) {
  const normalizedEventId = normalizeText(eventId);
  if (!normalizedEventId) return;

  await getAdminDatabase().ref(`stripe/events/${normalizedEventId}`).update({
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

module.exports = {
  toIsoFromUnixSeconds,
  normalizeText,
  normalizeLowerText,
  writeCompanyBilling,
  linkStripeCustomerToCompany,
  linkStripeSubscriptionToCompany,
  resolveCompanyIdFromCustomer,
  resolveCompanyIdFromSubscription,
  getCompanyBillingSnapshot,
  readStripeEvent,
  upsertStripeEvent,
};
