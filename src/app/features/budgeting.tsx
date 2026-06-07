import React from 'react';
import { FeatureDetailPage } from '@/components/marketing/FeatureDetailPage';
import { PUBLIC_FEATURES } from '@/content/publicSite';

export default function BudgetingFeaturePage() {
  const feature = PUBLIC_FEATURES.find((item) => item.slug === 'budgeting');

  if (!feature) {
    return null;
  }

  return <FeatureDetailPage feature={feature} />;
}
