import { Alert, Platform } from 'react-native';

interface ConfirmDestructiveOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

export function confirmDestructive({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
}: ConfirmDestructiveOptions) {
  const webConfirm = (globalThis as typeof globalThis & { confirm?: (message?: string) => boolean }).confirm;

  if (Platform.OS === 'web' && typeof webConfirm === 'function') {
    if (webConfirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
