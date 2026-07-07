const { verifyFirebaseIdToken } = require('../_lib/firebase-auth');
const {
  findCustomerByFirebaseUid,
  listSubscriptionsForCustomer,
  selectPrimarySubscription,
} = require('../_lib/stripe-rest');
const { applyRateLimit, getBearerToken, requireMethod, sendJson } = require('../_lib/http');
const { captureServerException } = require('../_lib/sentry');

const normalizeSubscription = (subscription) => {
  if (!subscription) {
    return {
      plan: 'free',
      status: 'none',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      latestInvoiceStatus: null,
    };
  }

  return {
    plan: subscription.metadata?.plan || 'premium',
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end ? subscription.current_period_end * 1000 : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    latestInvoiceStatus: typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice.status : null,
  };
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }
  if (!(await applyRateLimit(req, res, { keyPrefix: 'billing:status', max: 60, windowMs: 60 * 1000 }))) {
    return;
  }

  try {
    const token = getBearerToken(req);
    const user = await verifyFirebaseIdToken(token);
    const customer = await findCustomerByFirebaseUid(user.uid);

    if (!customer) {
      return sendJson(res, 200, normalizeSubscription(null));
    }

    const subscriptions = await listSubscriptionsForCustomer(customer.id);
    const primarySubscription = selectPrimarySubscription(subscriptions.data || []);

    return sendJson(res, 200, normalizeSubscription(primarySubscription));
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'billing', route: '/api/billing/status' },
    });
    const status = [413, 503].includes(error.statusCode) ? error.statusCode : 401;
    const message =
      status === 503 || status === 413
        ? error.message
        : 'Unable to read billing status. Sign in again and try once more.';
    return sendJson(res, status, { error: message });
  }
};
