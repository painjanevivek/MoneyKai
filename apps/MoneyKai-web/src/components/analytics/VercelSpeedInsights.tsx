import { useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'expo-router';
import { Platform } from 'react-native';
import type { BeforeSendMiddleware } from '@vercel/speed-insights';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { sanitizeAnalyticsPath } from '@/services/analytics';
import {
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  hasAnalyticsConsent,
  subscribeCookieConsent,
} from '@/services/cookieConsent';

const sanitizeSpeedInsightsUrl = (value: string) => {
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${sanitizeAnalyticsPath(url.pathname)}`;
  } catch {
    return sanitizeAnalyticsPath(value);
  }
};

export function VercelSpeedInsights() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot
  );

  const beforeSend = useCallback<BeforeSendMiddleware>((event) => {
    if (!hasAnalyticsConsent()) {
      return null;
    }

    return {
      ...event,
      url: sanitizeSpeedInsightsUrl(event.url),
      route: event.route ? sanitizeAnalyticsPath(event.route) : event.route,
    };
  }, []);

  if (Platform.OS !== 'web' || consent !== 'accepted') {
    return null;
  }

  return <SpeedInsights route={sanitizeAnalyticsPath(pathname)} beforeSend={beforeSend} />;
}
