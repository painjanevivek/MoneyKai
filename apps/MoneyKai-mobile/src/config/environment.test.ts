import { describe, expect, it, vi } from 'vitest';

type EnvironmentModule = typeof import('./environment');

const trackedEnvKeys = [
  'EXPO_PUBLIC_BACKEND_BASE_URL',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
] as const;

const loadEnvironment = async (env: Partial<Record<(typeof trackedEnvKeys)[number], string>>): Promise<EnvironmentModule> => {
  const previousValues = new Map<string, string | undefined>();

  for (const key of trackedEnvKeys) {
    previousValues.set(key, process.env[key]);
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }

  vi.resetModules();
  const environmentModule = await import('./environment');

  for (const [key, value] of previousValues) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
  return environmentModule;
};

describe('app environment', () => {
  it('normalizes a bare deployed backend host to HTTPS', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_BACKEND_BASE_URL: 'money-kai-backend.vercel.app',
    });

    expect(environment.getBackendBaseUrl()).toBe('https://money-kai-backend.vercel.app');
  });

  it('keeps explicit local backend URLs intact', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_BACKEND_BASE_URL: 'http://localhost:8000/',
    });

    expect(environment.getBackendBaseUrl()).toBe('http://localhost:8000');
  });

  it('treats Android Google sign-in as configured without an iOS client ID', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-client.apps.googleusercontent.com',
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: 'android-client.apps.googleusercontent.com',
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: '',
    });

    expect(environment.hasGoogleClientIds('android')).toBe(true);
    expect(environment.hasGoogleClientIds('ios')).toBe(false);
    expect(environment.hasGoogleClientIds()).toBe(true);
  });
});
