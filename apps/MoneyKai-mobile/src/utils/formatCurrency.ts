import {
  formatAmountChange,
  formatCompactCurrency as formatCompactCurrencyWithSymbol,
  formatCurrency as formatCurrencyWithSymbol,
  formatPercentage,
} from '@moneykai/domain';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  convertInrToCurrency,
  getCurrencySymbol,
  resolveCurrencyCode,
} from '@/utils/currencyConversion';

const getActiveCurrencyCode = () => resolveCurrencyCode(useSettingsStore.getState().currency, 'INR');

export const convertFromInrForDisplay = (amount: number, currency?: string): number => {
  const settings = useSettingsStore.getState();
  const targetCurrency = resolveCurrencyCode(currency, getActiveCurrencyCode());
  return convertInrToCurrency(amount, targetCurrency, settings.exchangeRates);
};

export const formatCurrency = (
  amount: number,
  currency: string = getActiveCurrencyCode(),
  showDecimal: boolean = false
): string => {
  const targetCurrency = resolveCurrencyCode(currency, getActiveCurrencyCode());
  const convertedAmount = convertFromInrForDisplay(amount, targetCurrency);
  return formatCurrencyWithSymbol(convertedAmount, getCurrencySymbol(targetCurrency), showDecimal);
};

export const formatCompactCurrency = (
  amount: number,
  currency: string = getActiveCurrencyCode()
): string => {
  const targetCurrency = resolveCurrencyCode(currency, getActiveCurrencyCode());
  const convertedAmount = convertFromInrForDisplay(amount, targetCurrency);
  return formatCompactCurrencyWithSymbol(convertedAmount, getCurrencySymbol(targetCurrency));
};

export {
  formatAmountChange,
  formatPercentage,
};
