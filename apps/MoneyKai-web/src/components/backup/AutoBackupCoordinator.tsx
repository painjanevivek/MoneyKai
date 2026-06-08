import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { flushAutomaticBackup } from '@/services/backupService';

export function AutoBackupCoordinator() {
  useEffect(() => {
    void flushAutomaticBackup({ force: false });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' || nextState === 'background' || nextState === 'inactive') {
        void flushAutomaticBackup({ force: nextState !== 'active' });
      }
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          void flushAutomaticBackup({ force: true });
        }
      };

      const handleBeforeUnload = () => {
        void flushAutomaticBackup({ force: true });
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        subscription.remove();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
