export type SupportedCurrencyCode = 'INR' | 'USD' | 'EUR' | 'JPY';

export type CurrencyExchangeRates = Record<SupportedCurrencyCode, number>;

export type CurrencyRateFetchResult = {
  rates: CurrencyExchangeRates;
  fetchedAt: string;
  provider: string;
};

export const BASE_CURRENCY: SupportedCurrencyCode = 'INR';
export const EXCHANGE_RATE_PROVIDER = 'ExchangeRate-API Open Access';
export const EXCHANGE_RATE_TTL_MS = 6 * 60 * 60 * 1000;

export const FALLBACK_INR_EXCHANGE_RATES: CurrencyExchangeRates = {
  INR: 1,
  USD: 0.0117,
  EUR: 0.0108,
  JPY: 1.82,
};

export const CURRENCY_SYMBOLS: Record<SupportedCurrencyCode, string> = {
  INR: '\u20B9',
  USD: '$',
  EUR: '\u20AC',
  JPY: '\u00A5',
};

const SYMBOL_TO_CODE: Record<string, SupportedCurrencyCode> = {
  '\u20B9': 'INR',
  Rs: 'INR',
  '$': 'USD',
  '\u20AC': 'EUR',
  '\u00A5': 'JPY',
};

export const isSupportedCurrencyCode = (value: string | null | undefined): value is SupportedCurrencyCode =>
  value === 'INR' || value === 'USD' || value === 'EUR' || value === 'JPY';

export const resolveCurrencyCode = (
  value: string | null | undefined,
  fallback: SupportedCurrencyCode = BASE_CURRENCY
): SupportedCurrencyCode => {
  if (!value) {
    return fallback;
  }
  if (isSupportedCurrencyCode(value)) {
    return value;
  }
  return SYMBOL_TO_CODE[value] ?? fallback;
};

export const getCurrencySymbol = (code: string | null | undefined): string =>
  CURRENCY_SYMBOLS[resolveCurrencyCode(code)] ?? CURRENCY_SYMBOLS.INR;

export const normalizeExchangeRates = (rates?: Partial<Record<string, unknown>> | null): CurrencyExchangeRates => ({
  INR: 1,
  USD: typeof rates?.USD === 'number' && Number.isFinite(rates.USD) ? rates.USD : FALLBACK_INR_EXCHANGE_RATES.USD,
  EUR: typeof rates?.EUR === 'number' && Number.isFinite(rates.EUR) ? rates.EUR : FALLBACK_INR_EXCHANGE_RATES.EUR,
  JPY: typeof rates?.JPY === 'number' && Number.isFinite(rates.JPY) ? rates.JPY : FALLBACK_INR_EXCHANGE_RATES.JPY,
});

export const isExchangeRateFresh = (updatedAt?: string | null, now = Date.now()): boolean => {
  if (!updatedAt) {
    return false;
  }
  const updatedAtMs = Date.parse(updatedAt);
  return Number.isFinite(updatedAtMs) && now - updatedAtMs < EXCHANGE_RATE_TTL_MS;
};

export const convertInrToCurrency = (
  amountInInr: number,
  targetCurrency: string | null | undefined,
  rates?: Partial<Record<string, number>> | null
): number => {
  const code = resolveCurrencyCode(targetCurrency);
  const normalizedRates = normalizeExchangeRates(rates);
  return amountInInr * normalizedRates[code];
};

export async function fetchLatestInrExchangeRates(): Promise<CurrencyRateFetchResult> {
  const response = await fetch('https://open.er-api.com/v6/latest/INR', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Currency rates request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };

  if (payload.result !== 'success' || !payload.rates) {
    throw new Error('Currency rates are unavailable right now.');
  }

  return {
    rates: normalizeExchangeRates(payload.rates),
    fetchedAt: payload.time_last_update_utc
      ? new Date(payload.time_last_update_utc).toISOString()
      : new Date().toISOString(),
    provider: EXCHANGE_RATE_PROVIDER,
  };
}
