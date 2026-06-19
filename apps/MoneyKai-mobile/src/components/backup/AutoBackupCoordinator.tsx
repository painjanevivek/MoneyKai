import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { flushAutomaticBackup } from '@/services/backupService';

type BrowserDocumentLike = {
  visibilityState?: string;
  addEventListener: (eventName: string, handler: () => void) => void;
  removeEventListener: (eventName: string, handler: () => void) => void;
};

type BrowserWindowLike = {
  addEventListener: (eventName: string, handler: () => void) => void;
  removeEventListener: (eventName: string, handler: () => void) => void;
};

export function AutoBackupCoordinator() {
  useEffect(() => {
    void flushAutomaticBackup({ force: false });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' || nextState === 'background' || nextState === 'inactive') {
        void flushAutomaticBackup({ force: nextState !== 'active' });
      }
    });

    const browserGlobals = globalThis as typeof globalThis & {
      document?: BrowserDocumentLike;
      window?: BrowserWindowLike;
    };
    const browserDocument = browserGlobals.document;
    const browserWindow = browserGlobals.window;

    if (Platform.OS === 'web' && browserWindow && browserDocument) {
      const handleVisibilityChange = () => {
        if (browserDocument.visibilityState === 'hidden') {
          void flushAutomaticBackup({ force: true });
        }
      };

      const handleBeforeUnload = () => {
        void flushAutomaticBackup({ force: true });
      };

      browserDocument.addEventListener('visibilitychange', handleVisibilityChange);
      browserWindow.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        subscription.remove();
        browserDocument.removeEventListener('visibilitychange', handleVisibilityChange);
        browserWindow.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
