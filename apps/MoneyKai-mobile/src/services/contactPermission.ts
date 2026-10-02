import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform } from 'react-native';
import { runPermissionFlow } from './permissionFlow';

export const canReadContacts = (permission: string) => permission === 'authorized' || permission === 'limited';

export const getContactPermission = async () => Platform.OS === 'android'
  ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS) ? 'authorized' : 'denied'
  : Contacts.checkPermission();

export const ensureContactPermission = () => runPermissionFlow('contacts', async () => {
  const current = await getContactPermission();
  if (canReadContacts(current)) return current;
  // Use React Native's permission result listener, not the contacts library's
  // legacy ActivityCompat callback, which is unreliable on the new architecture.
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'authorized' : 'denied';
  }
  return Contacts.requestPermission();
});
