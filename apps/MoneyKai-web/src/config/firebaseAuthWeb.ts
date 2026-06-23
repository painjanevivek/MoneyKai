export const FIREBASE_AUTH_PROXY_HOSTS = ['moneykai.com', 'www.moneykai.com'] as const;

export const FIREBASE_AUTH_HELPER_PATHS = [
  '/__/auth',
  '/__/auth/:path*',
  '/__/firebase/init.json',
] as const;

export const getWebAuthDomain = (configuredAuthDomain: string, runtimeHost: string): string => {
  if ((FIREBASE_AUTH_PROXY_HOSTS as readonly string[]).includes(runtimeHost)) {
    return runtimeHost;
  }

  return configuredAuthDomain;
};
