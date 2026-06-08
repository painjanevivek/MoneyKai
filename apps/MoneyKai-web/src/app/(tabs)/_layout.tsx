import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { DesktopShell } from '@/components/layout/DesktopShell';
import { useAuthStore } from '@/stores/useAuthStore';

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);

  if (!isHydratingSession && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <DesktopShell>
      <Slot />
    </DesktopShell>
  );
}
