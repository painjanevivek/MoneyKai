import React from 'react';
import { FeatureDetailPage } from '@/components/marketing/FeatureDetailPage';
import { PUBLIC_FEATURES } from '@/content/publicSite';

export default function AnalyticsFeaturePage() {
  const feature = PUBLIC_FEATURES.find((item) => item.slug === 'analytics');

  if (!feature) {
    return null;
  }

  return <FeatureDetailPage feature={feature} />;
}
