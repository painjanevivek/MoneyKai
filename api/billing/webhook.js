const { readRawBody, requireMethod, sendJson } = require('../_lib/http');
const { captureServerException } = require('../_lib/sentry');
const { verifyStripeWebhookSignature } = require('../_lib/stripe-rest');

const BILLING_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
]);

const summarizeEvent = (event) => {
  const object = event.data?.object || {};
  return {
    id: event.id,
    type: event.type,
    customer: object.customer || null,
    subscription: object.subscription || object.id || null,
    status: object.status || null,
    firebaseUid: object.metadata?.firebase_uid || object.client_reference_id || null,
  };
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const event = verifyStripeWebhookSignature(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (BILLING_EVENTS.has(event.type)) {
      console.info('Verified Stripe billing event', summarizeEvent(event));
    }

    return sendJson(res, 200, { received: true });
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'billing', route: '/api/billing/webhook' },
    });
    return sendJson(res, error.statusCode || 400, { error: error.message || 'Invalid Stripe webhook.' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
