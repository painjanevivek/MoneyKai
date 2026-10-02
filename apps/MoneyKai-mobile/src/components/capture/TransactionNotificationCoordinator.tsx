import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { displayReviewNotification } from '@/services/reviewNotification';
import { readInitialShadeAction, subscribeShadeActions, takeShadeAction } from '@/services/notificationActions';
import { applyShadeAction } from '@/services/reviewNotificationActions';

type Navigation = (route: 'ReviewDrafts' | 'Transactions') => void;
/** Mounted INSIDE AppLockGate, after authentication/onboarding and nav readiness. */
export function TransactionNotificationCoordinator({ navigate, canNavigate }: { navigate: Navigation; canNavigate: () => boolean }) {
  const owner = useAuthStore(state => state.user?.id);
  useEffect(() => {
    if (!owner) return;
    let alive = true;
    let running = false;
    let rerun = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSignature = '';
    const stores = [useCaptureStore, useTransactionStore, useBudgetStore, useSettingsStore];
    const ready = () => alive && canNavigate() && AppState.currentState === 'active' && useAuthStore.getState().user?.id === owner && stores.every(store => store.persist.hasHydrated());
    const resume = async () => {
      if (!ready()) return;
      if (running) { rerun = true; return; }
      running = true;
      try {
        await readInitialShadeAction();
        if (!ready()) return;
        const action = await takeShadeAction(owner, ready);
        if (action && ready()) applyShadeAction(action, navigate, ready);
      } catch { /* Keep private data untouched when encrypted action storage is unavailable. */ }
      finally { running = false; if (rerun) { rerun = false; void resume(); } }
    };
    const update = (alert = false) => {
      if (!ready()) return;
      const ids = useCaptureStore.getState().drafts.filter(draft => draft.user_id === owner && draft.status === 'pending').map(draft => draft.id);
      const signature = ids.slice().sort().join('|');
      if (!alert && signature === lastSignature) return;
      lastSignature = signature;
      void displayReviewNotification(owner, ids, alert).catch(() => { lastSignature = ''; });
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { void resume(); update(); }, 600);
    };
    const disposers = stores.map(store => store.persist.onFinishHydration(() => { void resume(); update(true); }));
    disposers.push(useCaptureStore.subscribe(schedule), useSettingsStore.subscribe(() => { lastSignature = ''; schedule(); }), subscribeShadeActions(() => void resume()));
    const appState = AppState.addEventListener('change', state => { if (state === 'active') { void resume(); update(true); } });
    void resume(); update(true);
    return () => { alive = false; if (timer) clearTimeout(timer); appState.remove(); disposers.forEach(dispose => dispose()); };
  }, [owner, navigate, canNavigate]);
  return null;
}
