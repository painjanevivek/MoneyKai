import { describe, expect, it, vi } from 'vitest';
import {
  buildInternalTestingReport,
  formatInternalTestingReport,
  summarizeDiagnosticEvent,
} from './internalTestingReportService';
import type { DiagnosticEvent } from './diagnosticsService';

vi.mock('react-native', () => ({
  NativeModules: {},
  Platform: {
    OS: 'android',
    Version: 36,
    constants: {
      Brand: 'google',
      Manufacturer: 'Google',
      Model: 'Pixel 8',
      Release: '15',
      reactNativeVersion: { major: 0, minor: 85, patch: 3 },
    },
  },
}));

vi.mock('@react-native-clipboard/clipboard', () => ({
  default: {
    setString: vi.fn(),
  },
}));

vi.mock('@/config/environment', () => ({
  appEnvironment: {
    backendBaseUrl: '',
    debug: false,
    demoMode: false,
    smsResearchBuild: false,
    nativeSmsResearchBuild: false,
    gmailSyncEnabled: true,
    pdfStatementParsingEnabled: true,
    wealthTabEnabled: true,
    financialAiEnabled: false,
    sentry: {
      release: 'moneykai-mobile@1.0.1+abc123',
      dist: '42',
    },
  },
}));

vi.mock('@/firebase/firebaseConfig', () => ({
  isFirebaseConfigured: () => true,
}));

vi.mock('@/services/backendApi', () => ({
  isBackendConfigured: () => false,
}));

vi.mock('@/services/backupService', () => ({
  getAutomaticBackupStatusContext: vi.fn(async () => ({
    pending: false,
    queuedAt: null,
    lastBackupAt: '2026-06-25T10:00:00.000Z',
    reason: null,
  })),
}));

vi.mock('@/services/nativeCaptureBridge', () => ({
  getNativeCaptureStatus: vi.fn(async () => ({
    platform: 'android',
    notificationAccess: 'granted',
    smsAccess: 'unsupported',
    smsInboxAccess: 'unsupported',
    nativeModuleAvailable: true,
  })),
}));

vi.mock('@/stores/useCaptureStore', () => ({
  useCaptureStore: {
    getState: () => ({
      settings: {
        autoCaptureEnabled: true,
        notificationCaptureEnabled: true,
        notificationAccessStatus: 'granted',
        smsResearchModeEnabled: false,
        smsAccessStatus: 'unsupported',
      },
      drafts: [{ id: 'draft-1', status: 'pending' }],
      signals: [{ id: 'signal-1', processingStatus: 'drafted' }],
    }),
  },
}));

vi.mock('@/stores/useSyncStore', () => ({
  useSyncStore: {
    getState: () => ({
      status: 'synced',
      lastSyncedAt: '2026-06-25T09:00:00.000Z',
      lastCacheHydratedAt: '2026-06-25T08:00:00.000Z',
      pendingCount: 0,
      isOnline: true,
    }),
  },
}));

vi.mock('@/services/diagnosticsService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./diagnosticsService')>();
  return {
    ...actual,
    getRecentDiagnosticEvents: () => [],
  };
});

const diagnosticEvent = (overrides: Partial<DiagnosticEvent> = {}): DiagnosticEvent => ({
  id: 'diag-1',
  createdAt: '2026-06-25T10:30:00.000Z',
  scope: 'nativeCapture.import',
  message: 'Failed for UPI Ref 412345678901 and account XX4321',
  severity: 'warning',
  platform: 'android',
  appVersion: '1.0.1',
  errorName: 'Error',
  errorMessage: 'Raw SMS 999999 debited ref 412345678901',
  errorStack: 'stack should never be included',
  metadata: {
    body: 'Rs 120 debited from XX4321',
    reason: 'UPI Ref 412345678901 from user@upi',
  },
  ...overrides,
});

describe('internalTestingReportService', () => {
  it('formats release, device, capture, backup, and diagnostic context', () => {
    const report = buildInternalTestingReport({
      generatedAt: '2026-06-25T11:00:00.000Z',
      release: {
        appName: 'MoneyKai',
        packageName: 'com.moneykai.mobile',
        appVersion: '1.0.1',
        buildProfile: 'preview',
        releaseTag: 'moneykai-mobile@1.0.1+abc123',
        sentryRelease: 'moneykai-mobile@1.0.1+abc123',
        sentryDist: '42',
        featureFlags: { gmailSyncEnabled: true },
      },
      device: {
        platform: 'android',
        osVersion: '15',
        manufacturer: 'Google',
        brand: 'google',
        model: 'Pixel 8',
        reactNativeVersion: '0.85.3',
      },
      capture: {
        autoCaptureEnabled: true,
        notificationCaptureEnabled: true,
        notificationAccessState: 'granted',
        smsCaptureEnabled: false,
        smsAccessState: 'unsupported',
        nativeModuleAvailable: true,
        pendingDraftCount: 1,
        unconfirmedSignalCount: 1,
      },
      backup: {
        provider: 'firebase',
        syncStatus: 'synced',
        lastSyncedAt: '2026-06-25T09:00:00.000Z',
        lastCacheHydratedAt: '2026-06-25T08:00:00.000Z',
        pendingSyncCount: 0,
        isOnline: true,
        automaticBackup: {
          pending: false,
          queuedAt: null,
          lastBackupAt: '2026-06-25T10:00:00.000Z',
          reason: null,
        },
      },
      diagnostics: [diagnosticEvent()],
    });

    const text = formatInternalTestingReport(report);

    expect(text).toContain('MoneyKai Internal Testing Report');
    expect(text).toContain('buildProfile: preview');
    expect(text).toContain('notificationAccessState: granted');
    expect(text).toContain('provider: firebase');
    expect(text).toContain('[warning] 2026-06-25T10:30:00.000Z nativeCapture.import');
  });

  it('redacts raw financial identifiers and omits diagnostic stacks', () => {
    const summary = summarizeDiagnosticEvent(diagnosticEvent());
    const serialized = JSON.stringify(summary);

    expect(serialized).toContain('[ref]');
    expect(serialized).toContain('[masked]');
    expect(serialized).toContain('[Redacted]');
    expect(serialized).not.toContain('412345678901');
    expect(serialized).not.toContain('XX4321');
    expect(serialized).not.toContain('user@upi');
    expect(serialized).not.toContain('stack should never be included');
  });
});
