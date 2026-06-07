const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key'];

const readEnv = (key: string): string => process.env[key]?.trim() ?? '';

const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const storeReviewEnv = {
  iosUrl: readEnv('EXPO_PUBLIC_APP_STORE_URL'),
  androidUrl: readEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
};

export const getStoreReviewUrl = (platform: 'ios' | 'android'): string => {
  const configuredUrl = platform === 'ios' ? storeReviewEnv.iosUrl : storeReviewEnv.androidUrl;
  if (isRealValue(configuredUrl)) {
    return configuredUrl;
  }

  return platform === 'ios'
    ? 'https://apps.apple.com/search?term=MoneyKai'
    : 'https://play.google.com/store/search?q=MoneyKai&c=apps';
};
