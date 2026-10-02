import { Alert, AppState } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import type { ShadeAction } from './notificationActions';
import { displayReviewNotification } from './reviewNotification';

export function applyShadeAction(action: ShadeAction, navigate: (route: 'ReviewDrafts' | 'Transactions') => void, canApply = () => AppState.currentState === 'active') {
  if (!canApply() || useAuthStore.getState().user?.id !== action.ownerId) return;
  if (action.action === 'transactions') { navigate('Transactions'); return; }
  navigate('ReviewDrafts');
  if (action.action === 'review') return;
  const owner = action.ownerId;
  const ids = action.ids.filter(id => useCaptureStore.getState().drafts.some(draft => draft.id === id && draft.user_id === owner && draft.status === 'pending'));
  if (!ids.length) return;
  const refresh = () => void displayReviewNotification(owner, useCaptureStore.getState().drafts.filter(draft => draft.user_id === owner && draft.status === 'pending').map(draft => draft.id)).catch(() => undefined);
  if (action.action === 'allow' && !(useBudgetStore.getState().settings.monthly_allowance > 0)) {
    Alert.alert('Set a monthly budget', 'Set your budget before allowing drafts. They remain pending.'); return;
  }
  Alert.alert(`${action.action === 'allow' ? 'Allow' : 'Reject'} all ${ids.length} drafts?`, action.action === 'allow'
    ? 'Add this notification’s pending drafts. Unknown categories use Miscellaneous or Other Income. Invalid or duplicate drafts remain pending.'
    : 'Move this notification’s pending drafts to Reviewed as ignored. Existing transactions are not deleted.', [
    { text: 'Cancel', style: 'cancel' },
    { text: action.action === 'allow' ? 'Allow all' : 'Reject all', style: action.action === 'reject' ? 'destructive' : 'default', onPress: () => {
      if (!canApply() || useAuthStore.getState().user?.id !== owner) return;
      if (action.action === 'allow') {
        const result = useCaptureStore.getState().confirmAllDrafts(owner, ids);
        Alert.alert('Drafts updated', `${result.added} added. ${result.pending} still pending.${result.interrupted ? ' Approval stopped; check Activity before retrying.' : ''}`);
      } else {
        for (const id of ids) {
          if (!canApply() || useAuthStore.getState().user?.id !== owner) break;
          const draft = useCaptureStore.getState().drafts.find(item => item.id === id);
          if (draft?.user_id === owner && draft.status === 'pending') useCaptureStore.getState().ignoreDraft(id);
        }
      }
      refresh();
    } },
  ]);
}
