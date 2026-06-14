import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readText = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const readJson = <T>(path: string): T => JSON.parse(readText(path)) as T;

describe('SMS research build policy config', () => {
  it('blocks restricted SMS permissions in the native Android app manifest', () => {
    const manifest = readText('android/app/src/main/AndroidManifest.xml');

    [
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS',
      'android.permission.RECEIVE_MMS',
      'android.permission.RECEIVE_WAP_PUSH',
      'android.permission.SEND_SMS',
      'android.permission.WRITE_SMS',
    ].forEach((permission) => {
      expect(manifest).toContain(`android:name="${permission}" tools:node="remove"`);
    });
  });

  it('keeps native capture limited to notification listening in the CLI module manifest', () => {
    const manifest = readText('modules/moneykai-native-capture/android/src/main/AndroidManifest.xml');

    expect(manifest).toContain('android.service.notification.NotificationListenerService');
    expect(manifest).not.toContain('android.provider.Telephony.SMS_RECEIVED');
    expect(manifest).not.toContain('MoneyKaiSmsReceiver');
  });

  it('uses React Native CLI scripts and package dependencies instead of Expo build tooling', () => {
    const packageJson = readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    }>('package.json');
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(packageJson.scripts?.start).toBe('react-native start');
    expect(packageJson.scripts?.android).toBe('react-native run-android');
    expect(packageJson.scripts?.['android:bundle:release']).toBe('cd android && gradlew.bat :app:bundleRelease');
    expect(dependencies).not.toHaveProperty('expo');
    expect(dependencies).not.toHaveProperty('expo-router');
    expect(dependencies).not.toHaveProperty('eas-cli');
  });

  it('keeps capture inbox and raw SMS bodies out of the cloud backup snapshot contract', () => {
    const backupService = readText('src/services/backupService.ts');

    expect(backupService).not.toContain('useCaptureStore');
    expect(backupService).not.toContain('CapturedSignal');
    expect(backupService).not.toContain('DraftTransaction');
  });
});
