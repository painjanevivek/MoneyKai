const crypto = require('node:crypto');

const STRIPE_API_VERSION = '2026-05-27.dahlia';
const STRIPE_API_BASE = 'https://api.stripe.com';

const getStripeKey = () =>
  process.env.STRIPE_RESTRICTED_KEY ||
  process.env.STRIPE_SECRET_KEY ||
  '';

const appendFormValue = (params, key, value) => {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormValue(params, `${key}[${index}]`, item));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => appendFormValue(params, `${key}[${childKey}]`, childValue));
    return;
  }

  params.append(key, String(value));
};

const toFormBody = (payload) => {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => appendFormValue(params, key, value));
  return params;
};

const stripeRequest = async (method, path, payload = {}, options = {}) => {
  const key = getStripeKey();
  if (!key) {
    const error = new Error('Stripe billing is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const isGet = method === 'GET';
  const query = isGet ? toFormBody(payload).toString() : '';
  const response = await fetch(`${STRIPE_API_BASE}${path}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': STRIPE_API_VERSION,
      ...(isGet ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }),
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
    },
    body: isGet ? undefined : toFormBody(payload).toString(),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(data?.error?.message || `Stripe request failed with ${response.status}.`);
    error.statusCode = response.status;
    error.stripeCode = data?.error?.code;
    throw error;
  }

  return data;
};

const getPremiumPriceId = (plan) => {
  const plans = {
    premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    premium_annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  };

  return plans[plan] || '';
};

const isValidPremiumPlan = (plan) =>
  plan === 'premium_monthly' || plan === 'premium_annual';

const isStripeHostedUrl = (url, allowedHostnames) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && allowedHostnames.includes(parsed.hostname);
  } catch {
    return false;
  }
};

const findCustomerByFirebaseUid = async (uid) => {
  const query = `metadata['firebase_uid']:'${uid.replace(/'/g, "\\'")}'`;
  const result = await stripeRequest('GET', '/v1/customers/search', { query, limit: 1 });
  return result.data?.[0] || null;
};

const findOrCreateCustomer = async (user) => {
  const existingCustomer = await findCustomerByFirebaseUid(user.uid);
  if (existingCustomer) {
    return existingCustomer;
  }

  return stripeRequest(
    'POST',
    '/v1/customers',
    {
      email: user.email || undefined,
      name: user.name || undefined,
      metadata: { firebase_uid: user.uid },
    },
    { idempotencyKey: `customer:${user.uid}` }
  );
};

const listSubscriptionsForCustomer = (customerId) =>
  stripeRequest('GET', '/v1/subscriptions', {
    customer: customerId,
    status: 'all',
    limit: 10,
    expand: ['data.latest_invoice'],
  });

const selectPrimarySubscription = (subscriptions) => {
  const priority = ['active', 'trialing', 'past_due', 'incomplete', 'unpaid', 'paused', 'canceled'];
  return [...subscriptions].sort((a, b) => {
    const statusA = priority.includes(a.status) ? priority.indexOf(a.status) : priority.length;
    const statusB = priority.includes(b.status) ? priority.indexOf(b.status) : priority.length;
    const statusDelta = statusA - statusB;
    if (statusDelta !== 0) {
      return statusDelta;
    }
    return (b.created || 0) - (a.created || 0);
  })[0] || null;
};

const verifyStripeWebhookSignature = (rawBody, signatureHeader, secret) => {
  if (!signatureHeader || !secret) {
    throw new Error('Missing Stripe webhook signature configuration.');
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );
  const timestamp = Number(parts.t);
  const signatures = signatureHeader
    .split(',')
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    throw new Error('Malformed Stripe webhook signature.');
  }

  const toleranceSeconds = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300);
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > toleranceSeconds) {
    throw new Error('Stripe webhook signature timestamp is outside the tolerance window.');
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  const matched = signatures.some((signature) => {
    if (!/^[0-9a-f]+$/i.test(signature)) {
      return false;
    }

    const actualBuffer = Buffer.from(signature, 'hex');
    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  });

  if (!matched) {
    throw new Error('Stripe webhook signature verification failed.');
  }

  return JSON.parse(rawBody);
};

module.exports = {
  findCustomerByFirebaseUid,
  findOrCreateCustomer,
  getPremiumPriceId,
  isStripeHostedUrl,
  isValidPremiumPlan,
  listSubscriptionsForCustomer,
  selectPrimarySubscription,
  stripeRequest,
  verifyStripeWebhookSignature,
};
