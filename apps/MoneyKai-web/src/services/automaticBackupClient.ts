export const queueAutomaticBackup = (reason: string) => {
  void import('@/services/backupService')
    .then(({ requestAutomaticBackup }) => requestAutomaticBackup(reason))
    .catch((error) => {
      if (__DEV__) {
        console.warn('[MoneyKai] failed to queue automatic backup:', error);
      }
    });
};
