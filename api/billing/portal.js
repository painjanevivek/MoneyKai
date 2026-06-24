const { verifyFirebaseIdToken } = require('../_lib/firebase-auth');
const { findCustomerByFirebaseUid, isStripeHostedUrl, stripeRequest } = require('../_lib/stripe-rest');
const { applyRateLimit, getAppUrl, getBearerToken, requireMethod, sendJson } = require('../_lib/http');
const { captureServerException } = require('../_lib/sentry');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }
  if (!applyRateLimit(req, res, { keyPrefix: 'billing:portal', max: 15, windowMs: 60 * 1000 })) {
    return;
  }

  try {
    const token = getBearerToken(req);
    const user = await verifyFirebaseIdToken(token);
    const customer = await findCustomerByFirebaseUid(user.uid);

    if (!customer) {
      return sendJson(res, 404, { error: 'No Stripe billing profile exists for this user yet.' });
    }

    const session = await stripeRequest('POST', '/v1/billing_portal/sessions', {
      customer: customer.id,
      return_url: `${getAppUrl()}/pricing`,
    });

    if (!isStripeHostedUrl(session.url, ['billing.stripe.com'])) {
      throw Object.assign(new Error('Stripe returned an unexpected billing portal URL.'), { statusCode: 502 });
    }

    return sendJson(res, 200, { url: session.url });
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'billing', route: '/api/billing/portal' },
    });
    const status = [404, 413, 503].includes(error.statusCode) ? error.statusCode : 401;
    const message =
      status === 404 || status === 503 || status === 413
        ? error.message
        : 'Unable to open billing portal. Sign in again and try once more.';
    return sendJson(res, status, { error: message });
  }
};
