import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  moveDashboardSection,
  normalizeDashboardLayout,
  type DashboardSectionId,
} from './dashboardLayout';

const STORAGE_PREFIX = 'moneykai.dashboard-layout.v1';

export function useDashboardLayout(userId?: string) {
  const storageKey = `${STORAGE_PREFIX}:${userId ?? 'local'}`;
  const [order, setOrder] = React.useState<DashboardSectionId[]>([...DEFAULT_DASHBOARD_LAYOUT]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (!active) return;
        if (stored) setOrder(normalizeDashboardLayout(JSON.parse(stored)));
        else setOrder([...DEFAULT_DASHBOARD_LAYOUT]);
      })
      .catch(() => {
        if (active) setOrder([...DEFAULT_DASHBOARD_LAYOUT]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, [storageKey]);

  React.useEffect(() => {
    if (!loaded) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(order));
  }, [loaded, order, storageKey]);

  const moveSection = React.useCallback((section: DashboardSectionId, direction: -1 | 1) => {
    setOrder((current) => moveDashboardSection(current, section, direction));
  }, []);
  const resetLayout = React.useCallback(() => setOrder([...DEFAULT_DASHBOARD_LAYOUT]), []);
  const customized = order.some((section, index) => section !== DEFAULT_DASHBOARD_LAYOUT[index]);

  return { order, moveSection, resetLayout, customized, loaded };
}
