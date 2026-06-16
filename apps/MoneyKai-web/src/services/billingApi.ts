import { firebaseAuth } from './firebase';
import { addSentryBreadcrumb, captureSentryException, startSentrySpan } from './sentry';

export type BillingPlanKey = 'premium_monthly' | 'premium_annual';

export type BillingStatus = {
  plan: 'free' | 'premium' | BillingPlanKey;
  status: 'none' | 'active' | 'trialing' | 'past_due' | 'incomplete' | 'unpaid' | 'paused' | 'canceled';
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceStatus: string | null;
};

const getAuthToken = async (): Promise<string> => {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error('Sign in before managing billing.');
  }

  return user.getIdToken(true);
};

const requestBilling = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  return startSentrySpan(
    {
      name: `${init.method ?? 'GET'} ${path}`,
      op: 'http.client',
      attributes: {
        'moneykai.feature': 'billing',
        'http.method': init.method ?? 'GET',
        'url.path': path,
      },
    },
    async () => {
      const token = await getAuthToken();
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      headers.set('Authorization', `Bearer ${token}`);
      if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
      }

      await addSentryBreadcrumb({
        category: 'billing',
        message: `Billing request ${path}`,
        level: 'info',
        data: { method: init.method ?? 'GET', path },
      });

      const response = await fetch(path, {
        ...init,
        headers,
        credentials: 'same-origin',
      });
      const text = await response.text();
      const payload = text
        ? (() => {
            try {
              return JSON.parse(text);
            } catch {
              return {};
            }
          })()
        : {};

      if (!response.ok) {
        const error = new Error(payload.error || `Billing request failed with ${response.status}.`);
        await captureSentryException(error, {
          tags: {
            feature: 'billing',
            endpoint: path,
            status: String(response.status),
          },
        });
        throw error;
      }

      return payload as T;
    }
  );
};

export const billingApi = {
  getStatus: () => requestBilling<BillingStatus>('/api/billing/status'),
  createCheckoutSession: (plan: BillingPlanKey) =>
    requestBilling<{ id: string; url: string }>('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
  createPortalSession: () =>
    requestBilling<{ url: string }>('/api/billing/portal', {
      method: 'POST',
    }),
};
