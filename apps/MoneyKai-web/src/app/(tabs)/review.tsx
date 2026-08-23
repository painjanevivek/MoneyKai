import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ReviewWorkspace } from '@/features/review/ReviewWorkspace';
import type { ReviewFilters, ReviewItemStatus, ReviewSource } from '@/types/review';

const REVIEW_STATUSES = new Set(['pending', 'deferred', 'approved', 'ignored', 'duplicate', 'conflict']);
const REVIEW_SOURCES = new Set(['sms', 'gmail', 'pdf', 'portfolio', 'manual', 'account_aggregator']);

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ status?: string; source?: string; item?: string }>();
  const initialFilters: ReviewFilters = {
    status: REVIEW_STATUSES.has(params.status ?? '') ? params.status as ReviewItemStatus : 'pending',
    source: REVIEW_SOURCES.has(params.source ?? '') ? params.source as ReviewSource : undefined,
  };
  const handleFiltersChange = React.useCallback((filters: ReviewFilters, selectedId?: string) => {
    router.setParams({ status: filters.status, source: filters.source, item: selectedId } as any);
  }, []);
  return <ReviewWorkspace initialFilters={initialFilters} initialItemId={params.item} onFiltersChange={handleFiltersChange} onOpenDashboard={() => router.push('/dashboard' as any)} />;
}
