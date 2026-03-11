/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({
  maxInstances: 10, 
  region: 'europe-west1',
  timeoutSeconds: 60,
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

/*
const Stripe = require("stripe")

// Create a checkout session for Stripe payments (Template function)

exports.createCheckoutSession = onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      res.status(500).json({ error: 'missing_stripe_secret' })
      return
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const successUrl = req.body?.successUrl || 'http://localhost:5173/payment-success'
      const cancelUrl = req.body?.cancelUrl || 'http://localhost:5173/payment-cancel'
      const priceId = process.env.STRIPE_PRICE_ID

      if (!priceId) {
        res.status(500).json({ error: 'missing_stripe_price_id' })
        return
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      })

      res.json({ url: session.url })
    } catch (error) {
      logger.error('createCheckoutSession failed', error)
      res.status(500).json({ error: 'checkout_failed' })
    }
  }
);
*/