import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact } from 'react-native-contacts';
const mock = vi.hoisted(() => ({ check: vi.fn(), request: vi.fn(), read: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
// Match the installed 8.0.10 runtime: only a DEFAULT export, unlike its named-export .d.ts.
vi.mock('react-native-contacts', () => ({ default: { checkPermission: mock.check, requestPermission: mock.request, getAllWithoutPhotos: mock.read } }));
import { readContactDirectory } from './contactDirectory';
const contact = (recordID: string, displayName: string | null, other = {}) => ({ recordID, displayName, ...other }) as Contact;
describe('on-device contact directory', () => {
  beforeEach(() => { vi.clearAllMocks(); mock.check.mockResolvedValue('denied'); mock.request.mockResolvedValue('authorized'); mock.read.mockResolvedValue([]); });
  it('requests permission before any read on explicit Choose people opening', async () => {
    mock.read.mockResolvedValue([contact('2', 'Zoya'), contact('1', null, { givenName: 'Akshay', middleName: 'Naresh', familyName: 'Painjane' }), contact('3', 'Zoya'), contact('2', 'Duplicate')]);
    const result = await readContactDirectory(true);
    expect(mock.request).toHaveBeenCalledOnce(); expect(mock.request.mock.invocationCallOrder[0]).toBeLessThan(mock.read.mock.invocationCallOrder[0]);
    expect(result.people).toEqual([{ contactId: '1', name: 'Akshay Naresh Painjane' }, { contactId: '2', name: 'Zoya' }, { contactId: '3', name: 'Zoya' }]);
  });
  it('never reads on denied permission or requests on a passive app resume', async () => {
    mock.request.mockResolvedValue('denied'); expect((await readContactDirectory(true)).state).toBe('denied');
    await readContactDirectory(false); expect(mock.request).toHaveBeenCalledOnce(); expect(mock.read).not.toHaveBeenCalled();
  });
  it('reuses authorized permission and exposes only IDs/names, not phone or email data', async () => {
    mock.check.mockResolvedValue('authorized'); mock.read.mockResolvedValue([contact('1', null, { phoneNumbers: [{ number: '12345' }], emailAddresses: [{ email: 'private@example.invalid' }] })]);
    expect((await readContactDirectory(true)).people).toEqual([{ contactId: '1', name: 'Unnamed contact' }]);
    expect(mock.request).not.toHaveBeenCalled();
  });
});
