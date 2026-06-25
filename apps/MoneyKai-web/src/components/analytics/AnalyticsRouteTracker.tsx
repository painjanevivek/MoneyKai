import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { trackPageView } from '@/services/analytics';

export function AnalyticsRouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
