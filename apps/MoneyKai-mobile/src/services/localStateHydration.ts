import { useBadgeStore } from '@/stores/useBadgeStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { usePriceMemoryStore } from '@/stores/usePriceMemoryStore';

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

export const waitForPersistedStore = (store: PersistedStore): Promise<void> => {
  if (store.persist.hasHydrated()) return Promise.resolve();

  return new Promise((resolve) => {
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });

    // Hydration may have completed between the first check and registration.
    if (store.persist.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
};

export const waitForLocalStateHydration = () => Promise.all([
  useSettingsStore,
  useBudgetStore,
  useTransactionStore,
  useNotesStore,
  useGroupStore,
  useChallengeStore,
  useBadgeStore,
  useNotificationStore,
  useLinkedAccountStore,
  usePriceMemoryStore,
].map(waitForPersistedStore)).then(() => undefined);

export const waitForHomeStateHydration = () => Promise.all([
  useSettingsStore,
  useBudgetStore,
  useTransactionStore,
].map(waitForPersistedStore)).then(() => undefined);
