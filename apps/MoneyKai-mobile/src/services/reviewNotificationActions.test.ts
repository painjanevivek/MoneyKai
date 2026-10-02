import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ owner: 'owner', budget: 1000, drafts: [] as any[], alert: vi.fn(), allow: vi.fn(), ignore: vi.fn(), refresh: vi.fn() }));
vi.mock('react-native', () => ({ Alert: { alert: mock.alert }, AppState: { currentState: 'active' } }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: mock.owner } }) } }));
vi.mock('@/stores/useBudgetStore', () => ({ useBudgetStore: { getState: () => ({ settings: { monthly_allowance: mock.budget } }) } }));
vi.mock('@/stores/useCaptureStore', () => ({ useCaptureStore: { getState: () => ({ drafts: mock.drafts, confirmAllDrafts: mock.allow, ignoreDraft: mock.ignore }) } }));
vi.mock('./reviewNotification', () => ({ displayReviewNotification: mock.refresh }));
import { applyShadeAction } from './reviewNotificationActions';
import type { ShadeAction } from './notificationActions';
const action = (kind: ShadeAction['action']): ShadeAction => ({ ownerId: 'owner', token: 'snapshot', ids: ['a', 'foreign', 'already'], action: kind, at: Date.now() });
describe('unlocked notification review actions', () => {
  beforeEach(() => { vi.clearAllMocks(); mock.owner = 'owner'; mock.budget = 1000; mock.drafts = [{ id: 'a', user_id: 'owner', status: 'pending' }, { id: 'later', user_id: 'owner', status: 'pending' }, { id: 'foreign', user_id: 'other', status: 'pending' }, { id: 'already', user_id: 'owner', status: 'confirmed' }]; mock.allow.mockReturnValue({ added: 1, pending: 0, interrupted: false }); mock.refresh.mockResolvedValue(undefined); });
  it('reviews directly but never changes anything merely by opening the notification', () => {
    const navigate = vi.fn(); applyShadeAction(action('review'), navigate);
    expect(navigate).toHaveBeenCalledWith('ReviewDrafts'); expect(mock.alert).not.toHaveBeenCalled(); expect(mock.allow).not.toHaveBeenCalled();
  });
  it('allows only the pending owned notification snapshot, after explicit confirmation', () => {
    applyShadeAction(action('allow'), vi.fn()); expect(mock.allow).not.toHaveBeenCalled();
    mock.alert.mock.calls[0][2][1].onPress(); expect(mock.allow).toHaveBeenCalledExactlyOnceWith('owner', ['a']);
    expect(mock.refresh).toHaveBeenCalled();
  });
  it('rejects only pending owned snapshot drafts, not future drafts or ledger transactions', () => {
    applyShadeAction(action('reject'), vi.fn()); expect(mock.ignore).not.toHaveBeenCalled();
    mock.alert.mock.calls[0][2][1].onPress(); expect(mock.ignore).toHaveBeenCalledExactlyOnceWith('a'); expect(mock.allow).not.toHaveBeenCalled();
  });
  it('blocks an account change during confirmation and requires a budget for approval', () => {
    applyShadeAction(action('allow'), vi.fn()); mock.owner = 'other'; mock.alert.mock.calls[0][2][1].onPress(); expect(mock.allow).not.toHaveBeenCalled();
    vi.clearAllMocks(); mock.owner = 'owner'; mock.budget = 0; applyShadeAction(action('allow'), vi.fn()); expect(mock.alert.mock.calls[0][0]).toBe('Set a monthly budget');
    expect(mock.allow).not.toHaveBeenCalled();
  });
  it('ignores foreign notification responses and opens Activity for success taps', () => {
    mock.owner = 'other'; const navigate = vi.fn(); applyShadeAction(action('allow'), navigate); expect(navigate).not.toHaveBeenCalled();
    mock.owner = 'owner'; applyShadeAction(action('transactions'), navigate); expect(navigate).toHaveBeenCalledWith('Transactions');
  });
  it('blocks a confirmation if the app locked or left the foreground after the dialog opened', () => {
    let ready = true;
    applyShadeAction(action('allow'), vi.fn(), () => ready);
    ready = false; mock.alert.mock.calls[0][2][1].onPress();
    expect(mock.allow).not.toHaveBeenCalled();
    vi.clearAllMocks(); ready = true;
    applyShadeAction(action('reject'), vi.fn(), () => ready);
    ready = false; mock.alert.mock.calls[0][2][1].onPress();
    expect(mock.ignore).not.toHaveBeenCalled();
  });
});
