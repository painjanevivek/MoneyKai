import React from 'react';
import { FeatureDetailPage } from '@/components/marketing/FeatureDetailPage';
import { PUBLIC_FEATURES } from '@/content/publicSite';

export default function ExpenseTrackingFeaturePage() {
  const feature = PUBLIC_FEATURES.find((item) => item.slug === 'expense-tracking');

  if (!feature) {
    return null;
  }

  return <FeatureDetailPage feature={feature} />;
}
