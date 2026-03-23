const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

const { getPlanKeyByPriceId } = require("./config");
const { buildHttpError } = require("./auth");
const {
  toIsoFromUnixSeconds,
  normalizeText,
  normalizeLowerText,
  writeCompanyBilling,
  linkStripeCustomerToCompany,
  linkStripeSubscriptionToCompany,
  resolveCompanyIdFromCustomer,
  resolveCompanyIdFromSubscription,
  readStripeEvent,
  upsertStripeEvent,
} = require("./billingStore");

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

const HANDLED_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

function getStripeClient() {
  const secretKey = String(
      STRIPE_SECRET_KEY.value() || process.env.STRIPE_SECRET_KEY || ""
  ).trim();

  if (!secretKey) {
    throw new Error("missing_stripe_secret");
  }

  return new Stripe(secretKey);
}

function getWebhookSecret() {
  const webhookSecret = String(
      STRIPE_WEBHOOK_SECRET.value() || process.env.STRIPE_WEBHOOK_SECRET || ""
  ).trim();

  if (!webhookSecret) {
    throw new Error("missing_stripe_webhook_secret");
  }

  return webhookSecret;
}

function buildStripeEvent(req, stripe) {
  const signature = normalizeText(req.headers?.["stripe-signature"]);
  if (!signature) {
    throw buildHttpError(400, "missing_stripe_signature");
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    throw buildHttpError(400, "missing_raw_body");
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch {
    throw buildHttpError(400, "invalid_webhook_signature");
  }
}

async function resolveCompanyId({
  metadata = {},
  customerId = "",
  subscriptionId = "",
  clientReferenceId = "",
}) {
  const metadataCompanyId = normalizeText(metadata?.companyId || metadata?.company_id);
  if (metadataCompanyId) return metadataCompanyId;

  const normalizedClientReferenceId = normalizeText(clientReferenceId);
  if (normalizedClientReferenceId) return normalizedClientReferenceId;

  const companyIdFromSubscription = await resolveCompanyIdFromSubscription(subscriptionId);
  if (companyIdFromSubscription) return companyIdFromSubscription;

  return resolveCompanyIdFromCustomer(customerId);
}

function resolvePlanKeyFromPriceAndMetadata(priceId, metadata = {}) {
  const metadataPlanKey = normalizeLowerText(metadata?.planKey || metadata?.plan_key);
  if (metadataPlanKey) return metadataPlanKey;

  return normalizeLowerText(getPlanKeyByPriceId(priceId));
}

function pickFirstPositiveUnixTimestamp(...candidates) {
  for (const candidate of candidates) {
    const numericCandidate = Number(candidate || 0);
    if (Number.isFinite(numericCandidate) && numericCandidate > 0) {
      return numericCandidate;
    }
  }

  return 0;
}

function resolveSubscriptionPeriodStartTimestamp(subscription = {}) {
  return pickFirstPositiveUnixTimestamp(
      subscription?.current_period_start,
      subscription?.items?.data?.[0]?.current_period_start
  );
}

function resolveSubscriptionPeriodEndTimestamp(subscription = {}) {
  return pickFirstPositiveUnixTimestamp(
      subscription?.current_period_end,
      subscription?.items?.data?.[0]?.current_period_end
  );
}

function resolveInvoicePeriodStartTimestamp(invoice = {}) {
  return pickFirstPositiveUnixTimestamp(
      invoice?.lines?.data?.[0]?.period?.start,
      invoice?.period_start
  );
}

function resolveInvoicePeriodEndTimestamp(invoice = {}) {
  return pickFirstPositiveUnixTimestamp(
      invoice?.lines?.data?.[0]?.period?.end,
      invoice?.period_end
  );
}

async function handleCheckoutSessionCompleted(event, stripe) {
  const session = event?.data?.object || {};
  if (session?.mode !== "subscription") return;

  const sessionId = normalizeText(session?.id);
  const customerId = normalizeText(session?.customer);
  const subscriptionId = normalizeText(session?.subscription);
  const metadata = session?.metadata || {};
  const companyId = await resolveCompanyId({
    metadata,
    customerId,
    subscriptionId,
    clientReferenceId: session?.client_reference_id,
  });

  if (!companyId) {
    logger.warn("stripeWebhook checkout.session.completed missing companyId", {
      eventId: event?.id || "",
      sessionId,
      customerId,
      subscriptionId,
    });
    return;
  }

  let subscription = null;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  }

  const priceId = normalizeText(subscription?.items?.data?.[0]?.price?.id);
  const planKey = resolvePlanKeyFromPriceAndMetadata(priceId, metadata);
  const status = normalizeLowerText(
      subscription?.status || (session?.payment_status === "paid" ? "active" : "incomplete")
  );
  const currentPeriodStart = toIsoFromUnixSeconds(
      resolveSubscriptionPeriodStartTimestamp(subscription)
  );
  const currentPeriodEnd = toIsoFromUnixSeconds(
      resolveSubscriptionPeriodEndTimestamp(subscription)
  );
  const canceledAt = toIsoFromUnixSeconds(subscription?.canceled_at);
  const billingPatch = {
    planKey,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    latestCheckoutSessionId: sessionId,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    statusSource: "stripe_webhook",
  };

  if (currentPeriodStart) {
    billingPatch.currentPeriodStart = currentPeriodStart;
  }

  if (currentPeriodEnd) {
    billingPatch.currentPeriodEnd = currentPeriodEnd;
  }

  if (canceledAt) {
    billingPatch.canceledAt = canceledAt;
  }

  await Promise.all([
    linkStripeCustomerToCompany(customerId, companyId),
    linkStripeSubscriptionToCompany(subscriptionId, companyId),
    writeCompanyBilling(
        companyId,
        billingPatch,
        {
          planKey,
          status,
        }
    ),
  ]);
}

async function handleSubscriptionEvent(event) {
  const subscription = event?.data?.object || {};
  const customerId = normalizeText(subscription?.customer);
  const subscriptionId = normalizeText(subscription?.id);
  const metadata = subscription?.metadata || {};
  const priceId = normalizeText(subscription?.items?.data?.[0]?.price?.id);
  const planKey = resolvePlanKeyFromPriceAndMetadata(priceId, metadata);
  const status = normalizeLowerText(subscription?.status);
  const currentPeriodStart = toIsoFromUnixSeconds(
      resolveSubscriptionPeriodStartTimestamp(subscription)
  );
  const currentPeriodEnd = toIsoFromUnixSeconds(
      resolveSubscriptionPeriodEndTimestamp(subscription)
  );
  const canceledAt = toIsoFromUnixSeconds(subscription?.canceled_at);
  const billingPatch = {
    planKey,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    statusSource: "stripe_webhook",
  };

  if (currentPeriodStart) {
    billingPatch.currentPeriodStart = currentPeriodStart;
  }

  if (currentPeriodEnd) {
    billingPatch.currentPeriodEnd = currentPeriodEnd;
  }

  if (canceledAt) {
    billingPatch.canceledAt = canceledAt;
  }

  const companyId = await resolveCompanyId({
    metadata,
    customerId,
    subscriptionId,
  });

  if (!companyId) {
    logger.warn("stripeWebhook subscription event missing companyId", {
      eventId: event?.id || "",
      eventType: event?.type || "",
      customerId,
      subscriptionId,
    });
    return;
  }

  await Promise.all([
    linkStripeCustomerToCompany(customerId, companyId),
    linkStripeSubscriptionToCompany(subscriptionId, companyId),
    writeCompanyBilling(
        companyId,
        billingPatch,
        {
          planKey,
          status,
        }
    ),
  ]);
}

async function handleInvoiceEvent(event) {
  const invoice = event?.data?.object || {};
  const invoiceId = normalizeText(invoice?.id);
  const customerId = normalizeText(invoice?.customer);
  const subscriptionId = normalizeText(invoice?.subscription);
  const metadata = invoice?.metadata || {};
  const priceId = normalizeText(invoice?.lines?.data?.[0]?.price?.id);
  const planKey = resolvePlanKeyFromPriceAndMetadata(priceId, metadata);
  const companyId = await resolveCompanyId({
    metadata,
    customerId,
    subscriptionId,
  });

  if (!companyId) {
    logger.warn("stripeWebhook invoice event missing companyId", {
      eventId: event?.id || "",
      eventType: event?.type || "",
      invoiceId,
      customerId,
      subscriptionId,
    });
    return;
  }

  const paymentStatus =
    event?.type === "invoice.payment_failed" ? "failed" : normalizeLowerText(invoice?.status);
  const currentPeriodStart = toIsoFromUnixSeconds(resolveInvoicePeriodStartTimestamp(invoice));
  const currentPeriodEnd = toIsoFromUnixSeconds(resolveInvoicePeriodEndTimestamp(invoice));

  const patch = {
    planKey,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    latestInvoiceId: invoiceId,
    statusSource: "stripe_webhook",
    lastPayment: {
      amount: Number(invoice?.amount_paid || invoice?.amount_due || 0),
      currency: normalizeLowerText(invoice?.currency),
      status: paymentStatus,
      paidAt: toIsoFromUnixSeconds(invoice?.status_transitions?.paid_at),
      invoiceId,
    },
  };

  if (currentPeriodStart) {
    patch.currentPeriodStart = currentPeriodStart;
  }

  if (currentPeriodEnd) {
    patch.currentPeriodEnd = currentPeriodEnd;
  }

  const nextStatus = event?.type === "invoice.payment_failed" ? "past_due" : "active";

  await Promise.all([
    linkStripeCustomerToCompany(customerId, companyId),
    linkStripeSubscriptionToCompany(subscriptionId, companyId),
    writeCompanyBilling(companyId, patch, {
      planKey,
      status: nextStatus,
    }),
  ]);
}

async function handleStripeEvent(event, stripe) {
  switch (event?.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event, stripe);
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionEvent(event);
      return;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleInvoiceEvent(event);
      return;
    default:
      return;
  }
}

exports.stripeWebhook = onRequest({
  secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
}, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const stripe = getStripeClient();
    const event = buildStripeEvent(req, stripe);
    const eventId = normalizeText(event?.id);

    if (!eventId) {
      throw buildHttpError(400, "missing_event_id");
    }

    if (!HANDLED_EVENT_TYPES.has(event?.type)) {
      return res.json({ received: true, ignored: true });
    }

    const existingEvent = await readStripeEvent(eventId);
    if (existingEvent?.processedAt) {
      return res.json({ received: true, duplicated: true });
    }

    await upsertStripeEvent(eventId, {
      type: event?.type || "",
      receivedAt: new Date().toISOString(),
      processedAt: "",
      success: false,
    });

    await handleStripeEvent(event, stripe);

    await upsertStripeEvent(eventId, {
      processedAt: new Date().toISOString(),
      success: true,
      error: "",
    });

    return res.json({ received: true });
  } catch (error) {
    logger.error("stripeWebhook failed", {
      message: error?.message || String(error),
      code: error?.code || "",
      status: Number(error?.status || 500),
    });

    if (error?.code === "missing_event_id") {
      return res.status(400).json({ error: "missing_event_id" });
    }

    if (error?.code === "missing_stripe_signature") {
      return res.status(400).json({ error: "missing_stripe_signature" });
    }

    if (error?.code === "missing_raw_body") {
      return res.status(400).json({ error: "missing_raw_body" });
    }

    if (error?.code === "invalid_webhook_signature") {
      return res.status(400).json({ error: "invalid_webhook_signature" });
    }

    const errorCode = error?.message === "missing_stripe_webhook_secret"
      ? "missing_stripe_webhook_secret"
      : error?.message === "missing_stripe_secret"
        ? "missing_stripe_secret"
        : "stripe_webhook_failed";

    return res.status(500).json({ error: errorCode });
  }
});
