import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AnalyticsRedirect() {
  useEffect(() => {
    router.replace('/reports' as any);
  }, []);

  return null;
}
