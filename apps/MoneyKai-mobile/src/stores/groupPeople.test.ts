import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ owner: 'owner', update: vi.fn(), backup: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: mock.owner } }) } }));
vi.mock('@/services/backendApi', () => ({ backendApi: { updateGroup: mock.update } }));
vi.mock('@/services/notificationService', () => ({ recordAppNotification: vi.fn() }));
vi.mock('@/services/backupService', () => ({ requestAutomaticBackup: mock.backup }));
vi.mock('@/config/environment', () => ({ isDemoModeEnabled: () => false }));
import { useGroupStore } from './useGroupStore';
describe('adding people to an existing group', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mock.owner = 'owner';
    useGroupStore.setState({ groups: [{ id: 'g', created_by: 'owner', name: 'Group', type: 'friends', description: '', created_at: '', sync_status: 'confirmed', members: [{ id: 'm', user_id: 'owner', user_name: 'Owner', group_id: 'g', joined_at: '', role: 'admin' }] }], expenses: [] });
    mock.update.mockImplementation(async (_id, payload) => ({ item: { members: payload.members } }));
  });
  it('confirms new unique named people without sending contact IDs or rewriting previous expenses', async () => {
    const expenses = useGroupStore.getState().expenses;
    await useGroupStore.getState().addPeopleToGroup('g', ['Akshay Naresh Painjane', ' akshay naresh painjane ', 'Owner']);
    const group = useGroupStore.getState().groups[0];
    expect(group.members).toHaveLength(2); expect(group.members?.[1].user_name).toBe('Akshay Naresh Painjane');
    expect(group.sync_status).toBe('confirmed'); expect(group.pending_action).toBeUndefined();
    expect(mock.update).toHaveBeenCalledWith('g', { members: group.members });
    expect(useGroupStore.getState().expenses).toBe(expenses);
  });
  it('retains a retryable member update after timeout and retries the identical member IDs', async () => {
    mock.update.mockRejectedValueOnce(new Error('timeout'));
    await expect(useGroupStore.getState().addPeopleToGroup('g', ['Akshay'])).rejects.toThrow('timeout');
    const group = useGroupStore.getState().groups[0];
    expect(group.pending_action).toBe('members'); expect(group.sync_status).toBe('pending');
    const ids = group.members?.map(member => member.user_id);
    await useGroupStore.getState().addPeopleToGroup('g', []);
    expect(useGroupStore.getState().groups[0].members?.map(member => member.user_id)).toEqual(ids);
    expect(mock.update.mock.calls[1][1]).toEqual(mock.update.mock.calls[0][1]);
  });
  it('does not claim success if the server did not retain the added people', async () => {
    mock.update.mockResolvedValue({ item: { members: [] } });
    await expect(useGroupStore.getState().addPeopleToGroup('g', ['Akshay'])).rejects.toThrow('not confirmed');
    expect(useGroupStore.getState().groups[0].sync_status).not.toBe('confirmed');
  });
  it('blocks foreign and archived groups', async () => {
    mock.owner = 'other'; await expect(useGroupStore.getState().addPeopleToGroup('g', ['Akshay'])).rejects.toThrow('unavailable');
    mock.owner = 'owner'; useGroupStore.setState(state => ({ groups: state.groups.map(g => ({ ...g, archived: true })) }));
    await expect(useGroupStore.getState().addPeopleToGroup('g', ['Akshay'])).rejects.toThrow('unavailable');
    expect(mock.update).not.toHaveBeenCalled();
  });
});
