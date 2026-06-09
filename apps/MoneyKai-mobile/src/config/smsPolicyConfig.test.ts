import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(join(process.cwd(), path), 'utf8')) as T;

describe('SMS research build policy config', () => {
  it('keeps SMS research disabled for preview and production EAS builds', () => {
    const eas = readJson<{
      build: Record<string, { env?: Record<string, string> }>;
    }>('eas.json');

    expect(eas.build.development.env?.EXPO_PUBLIC_SMS_RESEARCH_BUILD).toBe('true');
    expect(eas.build.preview.env?.EXPO_PUBLIC_SMS_RESEARCH_BUILD).toBe('false');
    expect(eas.build.production.env?.EXPO_PUBLIC_SMS_RESEARCH_BUILD).toBe('false');
  });

  it('does not request restricted SMS permissions in app config', () => {
    const appConfig = readJson<{
      expo: {
        android?: {
          permissions?: string[];
        };
      };
    }>('app.json');

    const permissions = appConfig.expo.android?.permissions ?? [];
    expect(permissions).not.toContain('android.permission.READ_SMS');
    expect(permissions).not.toContain('android.permission.RECEIVE_SMS');
    expect(permissions).not.toContain('android.permission.RECEIVE_MMS');
    expect(permissions).not.toContain('android.permission.RECEIVE_WAP_PUSH');
    expect(permissions).not.toContain('android.permission.SEND_SMS');
    expect(permissions).not.toContain('android.permission.WRITE_SMS');
  });
});
