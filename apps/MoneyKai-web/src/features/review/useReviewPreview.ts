import React from 'react';
import { backendApi, isBackendConfigured } from '@/services/backendApi';
import type { ReviewItem } from '@/types/review';

export function useReviewPreview() {
  const configured = isBackendConfigured();
  const [items, setItems] = React.useState<ReviewItem[]>([]);
  const [loading, setLoading] = React.useState(configured);
  const [error, setError] = React.useState<string | null>(configured ? null : 'The review service is not configured for this environment.');

  React.useEffect(() => {
    if (!configured) return;
    let active = true;
    backendApi.listReviewItems({ status: 'pending' }, 3)
      .then((response) => {
        if (active) setItems(response.items);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Review status is unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [configured]);

  return { items, loading, error };
}
