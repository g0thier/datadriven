const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");

const {
  DEFAULT_ABONNEMENT_URL,
  setCorsHeaders,
  sanitizeUrl,
  buildRedirectUrl,
  getPlanConfig,
} = require("./config");
const { verifyRequestIdentity } = require("./auth");
const { writeCompanyBilling } = require("./billingStore");

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

function getStripeClient() {
  const secretKey = String(
      STRIPE_SECRET_KEY.value() || process.env.STRIPE_SECRET_KEY || ""
  ).trim();
  if (!secretKey) {
    throw new Error("missing_stripe_secret");
  }

  return new Stripe(secretKey);
}

function isPricePaid(price) {
  const unitAmount = Number(price?.unit_amount || 0);
  const unitAmountDecimal = Number(price?.unit_amount_decimal || 0);
  return unitAmount > 0 || unitAmountDecimal > 0;
}

exports.createCheckoutSession = onRequest({
  secrets: [STRIPE_SECRET_KEY],
}, async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const successBaseUrl = sanitizeUrl(req.body?.successUrl, DEFAULT_ABONNEMENT_URL);
  const cancelBaseUrl = sanitizeUrl(req.body?.cancelUrl, DEFAULT_ABONNEMENT_URL);
  const plan = getPlanConfig(req.body?.planName);

  if (!plan) {
    return res.status(400).json({ error: "invalid_plan" });
  }

  try {
    const identity = await verifyRequestIdentity(req);
    const stripe = getStripeClient();
    const customerEmail = String(identity?.userData?.email || "").trim();
    const checkoutMetadata = {
      companyId: identity.companyId,
      uid: identity.uid,
      planKey: plan.key,
    };

    if (plan.key === "hello") {
      const helloPrice = await stripe.prices.retrieve(plan.priceId);

      if (isPricePaid(helloPrice)) {
        await writeCompanyBilling(identity.companyId, {
          planKey: plan.key,
          stripePriceId: plan.priceId,
          statusSource: "direct_activation",
          directActivationAt: new Date().toISOString(),
        }, {
          planKey: plan.key,
          status: "active",
        });

        const activationUrl = buildRedirectUrl(successBaseUrl, {
          success: "true",
          plan: plan.key,
          mode: "direct_activation",
        });

        return res.json({
          url: activationUrl,
          mode: "direct_activation",
        });
      }
    }

    const successUrl = buildRedirectUrl(successBaseUrl, {
      success: "true",
      plan: plan.key,
      session_id: "{CHECKOUT_SESSION_ID}",
    });
    const cancelUrl = buildRedirectUrl(cancelBaseUrl, {
      canceled: "true",
      plan: plan.key,
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: identity.companyId,
      metadata: checkoutMetadata,
      subscription_data: {
        metadata: checkoutMetadata,
      },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
    });

    return res.json({
      url: checkoutSession.url,
      mode: "checkout",
      sessionId: checkoutSession.id,
      plan: plan.key,
    });
  } catch (error) {
    logger.error("createCheckoutSession failed", {
      error: error?.message || String(error),
      code: error?.code || "",
      plan: plan.key,
    });

    if (error?.status && error?.code) {
      return res.status(error.status).json({ error: error.code });
    }

    const errorCode = error?.message === "missing_stripe_secret"
      ? "missing_stripe_secret"
      : "checkout_failed";

    return res.status(500).json({ error: errorCode });
  }
});
