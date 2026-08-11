import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { DesktopShell } from '@/components/layout/DesktopShell';
import { ReportingMonthProvider } from '@/components/layout/ReportingMonthContext';
import { useAuthStore } from '@/stores/useAuthStore';

export const unstable_settings = {
  initialRouteName: 'dashboard',
};

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);

  if (!isHydratingSession && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <ReportingMonthProvider>
      <DesktopShell>
        <Slot />
      </DesktopShell>
    </ReportingMonthProvider>
  );
}
