const { verifyFirebaseIdToken } = require('../_lib/firebase-auth');
const { getAppUrl, getBearerToken, readJsonBody, requireMethod, sendJson } = require('../_lib/http');
const { captureServerException } = require('../_lib/sentry');
const { findOrCreateCustomer, getPremiumPriceId, isStripeHostedUrl, isValidPremiumPlan, stripeRequest } = require('../_lib/stripe-rest');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  try {
    const token = getBearerToken(req);
    const user = await verifyFirebaseIdToken(token);
    const body = await readJsonBody(req);
    const plan = body.plan;

    if (!isValidPremiumPlan(plan)) {
      return sendJson(res, 400, { error: 'Choose a valid billing plan.' });
    }

    const priceId = getPremiumPriceId(plan);

    if (!priceId) {
      return sendJson(res, 503, {
        error: 'Premium billing is not configured yet. Set STRIPE_PREMIUM_MONTHLY_PRICE_ID before enabling checkout.',
      });
    }

    const appUrl = getAppUrl();
    const customer = await findOrCreateCustomer(user);
    const session = await stripeRequest('POST', '/v1/checkout/sessions', {
      mode: 'subscription',
      customer: customer.id,
      client_reference_id: user.uid,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX_ENABLED !== 'false' },
      success_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { firebase_uid: user.uid, plan },
      subscription_data: { metadata: { firebase_uid: user.uid, plan } },
    });

    if (!isStripeHostedUrl(session.url, ['checkout.stripe.com'])) {
      throw Object.assign(new Error('Stripe returned an unexpected checkout URL.'), { statusCode: 502 });
    }

    return sendJson(res, 200, { id: session.id, url: session.url });
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'billing', route: '/api/billing/checkout' },
    });
    const status = [400, 413, 503].includes(error.statusCode) ? error.statusCode : 401;
    const message =
      status === 503
        ? error.message
        : status === 400 || status === 413
          ? error.message
          : 'Unable to start checkout. Sign in again and try once more.';
    return sendJson(res, status, { error: message });
  }
};
