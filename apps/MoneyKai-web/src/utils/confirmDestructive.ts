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
  if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
    if (globalThis.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
