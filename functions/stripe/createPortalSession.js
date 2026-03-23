const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

const {
  DEFAULT_ABONNEMENT_URL,
  setCorsHeaders,
  sanitizeUrl,
} = require("./config");

function getStripeClient() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
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

  if (!sessionId) {
    return res.status(400).json({ error: "missing_session_id" });
  }

  try {
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = String(checkoutSession?.customer || "").trim();

    if (!customerId) {
      return res.status(400).json({ error: "missing_customer" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.json({ url: portalSession.url });
  } catch (error) {
    logger.error("createPortalSession failed", {
      error: error?.message || String(error),
      sessionId,
    });

    const errorCode = error?.message === "missing_stripe_secret"
      ? "missing_stripe_secret"
      : "portal_failed";

    return res.status(500).json({ error: errorCode });
  }
});
