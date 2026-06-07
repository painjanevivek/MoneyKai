const DEFAULT_CURRENCY = '₹';
const DEFAULT_LOCALE = 'en-IN';

export const formatCurrency = (
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  showDecimal: boolean = false
): string => {
  if (showDecimal) {
    return `${currency} ${amount.toLocaleString(DEFAULT_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${currency} ${Math.round(amount).toLocaleString(DEFAULT_LOCALE)}`;
};

export const formatCompactCurrency = (amount: number, currency: string = DEFAULT_CURRENCY): string => {
  if (amount >= 10000000) {
    return `${currency} ${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `${currency} ${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatAmountChange = (current: number, previous: number): {
  text: string;
  isPositive: boolean;
  percentage: number;
} => {
  if (previous === 0) return { text: 'N/A', isPositive: true, percentage: 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    text: `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%`,
    isPositive: change <= 0, // For expenses, decrease is positive
    percentage: change,
  };
};
