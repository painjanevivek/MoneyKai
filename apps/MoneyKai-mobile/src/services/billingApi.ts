import { getBackendBaseUrl } from '@/config/environment';
import { getCurrentFirebaseIdToken } from './authService';
import { fetchWithRetry } from './networkClient';
import { addSentryBreadcrumb, captureSentryException, startSentrySpan } from './sentry';

export type BillingPlanKey = 'premium_monthly' | 'premium_annual';

export type BillingStatus = {
  plan: 'free' | 'premium' | BillingPlanKey;
  status: 'none' | 'active' | 'trialing' | 'past_due' | 'incomplete' | 'unpaid' | 'paused' | 'canceled';
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceStatus: string | null;
};

const billingBaseUrl = getBackendBaseUrl();

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return `Billing request failed with ${response.status}.`;
  }

  try {
    const payload = JSON.parse(text) as { error?: string; message?: string };
    return payload.error || payload.message || `Billing request failed with ${response.status}.`;
  } catch {
    return text;
  }
};

const requestBilling = async <T>(path: string, init: RequestInit = {}): Promise<T> =>
  startSentrySpan(
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
      const token = await getCurrentFirebaseIdToken();
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      headers.set('Authorization', `Bearer ${token}`);
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      addSentryBreadcrumb({
        category: 'billing',
        level: 'info',
        message: `Billing request ${path}`,
        data: { method: init.method ?? 'GET', path },
      });

      const response = await fetchWithRetry(`${billingBaseUrl}${path}`, {
        ...init,
        headers,
      });

      if (!response.ok) {
        const error = new Error(await readErrorMessage(response));
        captureSentryException(error, {
          tags: {
            feature: 'billing',
            endpoint: path,
            status: String(response.status),
          },
          level: 'warning',
        });
        throw error;
      }

      return (await response.json()) as T;
    },
  );

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
