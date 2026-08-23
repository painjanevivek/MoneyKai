import React from 'react';
import { backendApi } from '@/services/backendApi';
import type { ReviewActionRequest, ReviewActionResponse, ReviewFilters, ReviewItem } from '@/types/review';
import { useTransactionStore } from '@/stores/useTransactionStore';

const createActionKey = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `review_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
};

export function useReviewWorkspace(initialFilters: ReviewFilters, initialItemId?: string) {
  const [filters, setFilters] = React.useState<ReviewFilters>(initialFilters);
  const [items, setItems] = React.useState<ReviewItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialItemId ?? null);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [actioning, setActioning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastAction, setLastAction] = React.useState<ReviewActionResponse | null>(null);
  const actionKeys = React.useRef(new Map<string, string>());
  const requestSequence = React.useRef(0);

  const load = React.useCallback(async (mode: 'replace' | 'append' = 'replace') => {
    const sequence = ++requestSequence.current;
    if (mode === 'replace') setLoading(true);
    else setLoadingMore(true);
    if (mode === 'replace') setError(null);
    try {
      const response = await backendApi.listReviewItems(filters, 25, mode === 'append' ? nextCursor : undefined);
      if (sequence !== requestSequence.current) return;
      let incoming = response.items;
      if (mode === 'replace' && initialItemId && !incoming.some((item) => item.id === initialItemId)) {
        try {
          const detail = await backendApi.getReviewItem(initialItemId);
          if (sequence !== requestSequence.current) return;
          incoming = mergeById([detail.item], incoming);
        } catch {
          // The filtered queue remains usable when a stale deep-link target no longer exists.
        }
      }
      setItems((current) => mode === 'append' ? mergeById(current, incoming) : incoming);
      setNextCursor(response.page.nextCursor);
      if (mode === 'replace') {
        setSelectedId((current) => current && incoming.some((item) => item.id === current) ? current : incoming[0]?.id ?? null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Review items could not be loaded.');
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filters, initialItemId, nextCursor]);

  React.useEffect(() => {
    const task = setTimeout(() => void load('replace'), 0);
    return () => clearTimeout(task);
    // load is intentionally re-triggered only when server filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.source]);

  const performAction = React.useCallback(async (item: ReviewItem, payload: Omit<ReviewActionRequest, 'expectedRevision'>) => {
    const keyId = `${item.id}:${payload.action}:${item.revision}`;
    const idempotencyKey = actionKeys.current.get(keyId) ?? createActionKey();
    actionKeys.current.set(keyId, idempotencyKey);
    setActioning(true);
    setError(null);
    try {
      const response = await backendApi.actionReviewItem(item.id, {
        ...payload,
        expectedRevision: item.revision,
      }, idempotencyKey);
      actionKeys.current.delete(keyId);
      if (response.canonicalTransaction) {
        useTransactionStore.getState().applyConfirmedTransaction(response.canonicalTransaction);
      }
      setLastAction(response);
      setItems((current) => {
        const next = current.map((candidate) => candidate.id === response.item.id ? response.item : candidate);
        return filters.status && response.item.status !== filters.status
          ? next.filter((candidate) => candidate.id !== response.item.id)
          : next;
      });
      setSelectedId((current) => current === item.id ? null : current);
      return response;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The review action could not be confirmed.');
      return null;
    } finally {
      setActioning(false);
    }
  }, [filters.status]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return {
    filters,
    setFilters,
    items,
    selectedItem,
    selectItem: setSelectedId,
    loading,
    loadingMore,
    actioning,
    error,
    lastAction,
    clearLastAction: () => setLastAction(null),
    retry: () => load('replace'),
    loadMore: nextCursor ? () => load('append') : null,
    performAction,
  };
}

function mergeById(current: ReviewItem[], incoming: ReviewItem[]) {
  const items = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => items.set(item.id, item));
  return [...items.values()];
}
