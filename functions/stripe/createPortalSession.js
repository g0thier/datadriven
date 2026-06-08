const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

const {
  DEFAULT_ABONNEMENT_URL,
  setCorsHeaders,
  sanitizeUrl,
} = require("./config");
const { verifyRequestIdentity } = require("../common/auth");
const {
  getCompanyBillingSnapshot,
  linkStripeCustomerToCompany,
  writeCompanyBilling,
} = require("./billingStore");

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("missing_stripe_secret");
  }

  return new Stripe(secretKey);
}

exports.createPortalSession = onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const sessionId = String(req.body?.sessionId || "").trim();
  const returnUrl = sanitizeUrl(req.body?.returnUrl, DEFAULT_ABONNEMENT_URL);

  try {
    const identity = await verifyRequestIdentity(req);
    const stripe = getStripeClient();
    const companyBilling = await getCompanyBillingSnapshot(identity.companyId);
    let customerId = String(companyBilling?.stripeCustomerId || "").trim();

    if (!customerId && sessionId) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      customerId = String(checkoutSession?.customer || "").trim();
    }

    if (!customerId) {
      return res.status(400).json({ error: "missing_customer" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    await Promise.all([
      linkStripeCustomerToCompany(customerId, identity.companyId),
      writeCompanyBilling(identity.companyId, {
        stripeCustomerId: customerId,
      }),
    ]);

    return res.json({ url: portalSession.url });
  } catch (error) {
    logger.error("createPortalSession failed", {
      error: error?.message || String(error),
      code: error?.code || "",
      sessionId,
    });

    if (error?.status && error?.code) {
      return res.status(error.status).json({ error: error.code });
    }

    const errorCode = error?.message === "missing_stripe_secret"
      ? "missing_stripe_secret"
      : "portal_failed";

    return res.status(500).json({ error: errorCode });
  }
});
