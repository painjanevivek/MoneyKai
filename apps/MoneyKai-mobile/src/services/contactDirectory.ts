import Contacts from 'react-native-contacts';
import type { Contact } from 'react-native-contacts';
import type { SelectedPerson } from '@/utils/contactAllocations';
import { canReadContacts, ensureContactPermission, getContactPermission } from './contactPermission';

export function contactPeople(records: Contact[]): SelectedPerson[] {
  const seen = new Set<string>();
  return records.flatMap(record => {
    if (!record.recordID || seen.has(record.recordID)) return [];
    seen.add(record.recordID);
    const name = (record.displayName?.trim() || [record.givenName, record.middleName, record.familyName].filter(Boolean).join(' ').trim() || 'Unnamed contact');
    return [{ contactId: record.recordID, name }];
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

/** Only minimal IDs/names enter UI memory. No full address-book persistence or upload. */
export async function readContactDirectory(requestAccess: boolean) {
  const permission = requestAccess ? await ensureContactPermission() : await getContactPermission();
  if (!canReadContacts(permission)) return { state: 'denied' as const, people: [] };
  return { state: 'ready' as const, people: contactPeople(await Contacts.getAllWithoutPhotos()) };
}
