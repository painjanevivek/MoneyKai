import { NativeModules, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { appEnvironment } from '@/config/environment';
import { isFirebaseConfigured } from '@/firebase/firebaseConfig';
import { isBackendConfigured } from '@/services/backendApi';
import { getAutomaticBackupStatusContext, type AutomaticBackupStatusContext } from '@/services/backupService';
import { getRecentDiagnosticEvents, sanitizeMetadata, type DiagnosticEvent } from '@/services/diagnosticsService';
import { getNativeCaptureStatus, type NativeCaptureStatus } from '@/services/nativeCaptureBridge';
import { redactSensitiveSmsText } from '@/services/smsPrivacy';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useSyncStore } from '@/stores/useSyncStore';

const packageInfo = require('../../package.json') as { name?: string; version?: string };
const appJson = require('../../app.json') as { name?: string; displayName?: string };

const MAX_DIAGNOSTIC_EVENTS = 12;
const MAX_TEXT_LENGTH = 420;

type PlatformConstants = {
  Brand?: string;
  Manufacturer?: string;
  Model?: string;
  Release?: string;
  Version?: number | string;
  reactNativeVersion?: {
    major?: number;
    minor?: number;
    patch?: number;
  };
};

export interface InternalTestingReleaseMetadata {
  appName: string;
  packageName: string;
  appVersion: string;
  buildProfile: string;
  releaseTag: string;
  sentryRelease: string;
  sentryDist: string;
  featureFlags: Record<string, boolean>;
}

export interface InternalTestingDeviceContext {
  platform: string;
  osVersion: string;
  manufacturer: string;
  brand: string;
  model: string;
  reactNativeVersion: string;
}

export interface InternalTestingCaptureContext {
  autoCaptureEnabled: boolean;
  notificationCaptureEnabled: boolean;
  notificationAccessState: string;
  smsCaptureEnabled: boolean;
  smsAccessState: string;
  nativeModuleAvailable: boolean;
  pendingDraftCount: number;
  unconfirmedSignalCount: number;
}

export interface InternalTestingBackupContext {
  provider: 'backend' | 'firebase' | 'not_configured';
  syncStatus: string;
  lastSyncedAt: string | null;
  lastCacheHydratedAt: string | null;
  pendingSyncCount: number;
  isOnline: boolean;
  automaticBackup: AutomaticBackupStatusContext;
}

export interface InternalTestingDiagnosticSummary {
  createdAt: string;
  severity: DiagnosticEvent['severity'];
  scope: string;
  message: string;
  errorName?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface InternalTestingReport {
  generatedAt: string;
  release: InternalTestingReleaseMetadata;
  device: InternalTestingDeviceContext;
  capture: InternalTestingCaptureContext;
  backup: InternalTestingBackupContext;
  diagnostics: InternalTestingDiagnosticSummary[];
}

export interface InternalTestingReportInput {
  generatedAt?: string;
  release: InternalTestingReleaseMetadata;
  device: InternalTestingDeviceContext;
  capture: InternalTestingCaptureContext;
  backup: InternalTestingBackupContext;
  diagnostics: DiagnosticEvent[];
}

const valueOrUnknown = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return 'unknown';
};

const truncate = (value: string) =>
  value.length > MAX_TEXT_LENGTH ? `${value.slice(0, MAX_TEXT_LENGTH)}...` : value;

const sanitizeText = (value: string | undefined) =>
  value ? truncate(redactSensitiveSmsText(value)) : undefined;

const formatReactNativeVersion = (version: PlatformConstants['reactNativeVersion']) => {
  if (!version) {
    return 'unknown';
  }
  return [version.major, version.minor, version.patch]
    .filter((item) => item !== undefined && item !== null)
    .join('.');
};

const getPlatformConstants = (): PlatformConstants => {
  const constants = Platform.constants as PlatformConstants | undefined;
  const nativeConstants = NativeModules.PlatformConstants as PlatformConstants | undefined;
  return {
    ...nativeConstants,
    ...constants,
  };
};

const getReleaseMetadata = (): InternalTestingReleaseMetadata => {
  const releaseTag =
    appEnvironment.sentry.release ||
    process.env.EXPO_PUBLIC_RELEASE_TAG ||
    `${packageInfo.name ?? 'moneykai-mobile'}@${packageInfo.version ?? '0.0.0'}`;

  return {
    appName: appJson.displayName || appJson.name || 'MoneyKai',
    packageName: 'com.moneykai.mobile',
    appVersion: packageInfo.version ?? '0.0.0',
    buildProfile: process.env.EXPO_PUBLIC_BUILD_PROFILE || process.env.EXPO_PUBLIC_RELEASE_CHANNEL || 'unknown',
    releaseTag,
    sentryRelease: appEnvironment.sentry.release || 'not_configured',
    sentryDist: appEnvironment.sentry.dist || 'not_configured',
    featureFlags: {
      debug: appEnvironment.debug,
      demoMode: appEnvironment.demoMode,
      smsResearchBuild: appEnvironment.smsResearchBuild,
      nativeSmsResearchBuild: appEnvironment.nativeSmsResearchBuild,
      gmailSyncEnabled: appEnvironment.gmailSyncEnabled,
      pdfStatementParsingEnabled: appEnvironment.pdfStatementParsingEnabled,
      wealthTabEnabled: appEnvironment.wealthTabEnabled,
      financialAiEnabled: appEnvironment.financialAiEnabled,
    },
  };
};

const getDeviceContext = (): InternalTestingDeviceContext => {
  const constants = getPlatformConstants();
  return {
    platform: Platform.OS,
    osVersion: valueOrUnknown(constants.Release ?? Platform.Version),
    manufacturer: valueOrUnknown(constants.Manufacturer),
    brand: valueOrUnknown(constants.Brand),
    model: valueOrUnknown(constants.Model),
    reactNativeVersion: formatReactNativeVersion(constants.reactNativeVersion),
  };
};

const getCaptureContext = (nativeStatus?: NativeCaptureStatus): InternalTestingCaptureContext => {
  const captureState = useCaptureStore.getState();
  const settings = captureState.settings;
  return {
    autoCaptureEnabled: settings.autoCaptureEnabled,
    notificationCaptureEnabled: settings.notificationCaptureEnabled,
    notificationAccessState: nativeStatus?.notificationAccess ?? settings.notificationAccessStatus,
    smsCaptureEnabled: settings.smsResearchModeEnabled,
    smsAccessState: nativeStatus?.smsInboxAccess ?? nativeStatus?.smsAccess ?? settings.smsAccessStatus,
    nativeModuleAvailable: nativeStatus?.nativeModuleAvailable ?? false,
    pendingDraftCount: captureState.drafts.filter((draft) => draft.status === 'pending').length,
    unconfirmedSignalCount: captureState.signals.filter((signal) => signal.processingStatus !== 'confirmed').length,
  };
};

const getBackupProvider = (): InternalTestingBackupContext['provider'] => {
  if (isBackendConfigured()) {
    return 'backend';
  }
  if (isFirebaseConfigured()) {
    return 'firebase';
  }
  return 'not_configured';
};

const getBackupContext = async (): Promise<InternalTestingBackupContext> => {
  const syncState = useSyncStore.getState();
  return {
    provider: getBackupProvider(),
    syncStatus: syncState.status,
    lastSyncedAt: syncState.lastSyncedAt,
    lastCacheHydratedAt: syncState.lastCacheHydratedAt,
    pendingSyncCount: syncState.pendingCount,
    isOnline: syncState.isOnline,
    automaticBackup: await getAutomaticBackupStatusContext(),
  };
};

export const summarizeDiagnosticEvent = (event: DiagnosticEvent): InternalTestingDiagnosticSummary => ({
  createdAt: event.createdAt,
  severity: event.severity,
  scope: event.scope,
  message: sanitizeText(event.message) ?? 'Diagnostic event',
  errorName: sanitizeText(event.errorName),
  errorMessage: sanitizeText(event.errorMessage),
  metadata: sanitizeMetadata(event.metadata),
});

export const buildInternalTestingReport = (input: InternalTestingReportInput): InternalTestingReport => ({
  generatedAt: input.generatedAt ?? new Date().toISOString(),
  release: input.release,
  device: input.device,
  capture: input.capture,
  backup: input.backup,
  diagnostics: input.diagnostics
    .slice(-MAX_DIAGNOSTIC_EVENTS)
    .reverse()
    .map(summarizeDiagnosticEvent),
});

const formatMap = (values: object) =>
  Object.entries(values)
    .map(([key, value]) => `${key}: ${value === null || value === undefined ? 'unknown' : String(value)}`)
    .join('\n');

export const formatInternalTestingReport = (report: InternalTestingReport): string => {
  const diagnosticsText = report.diagnostics.length > 0
    ? report.diagnostics
        .map((event, index) => {
          const metadata = event.metadata && Object.keys(event.metadata).length > 0
            ? `\n  metadata: ${JSON.stringify(event.metadata)}`
            : '';
          const error = event.errorMessage ? `\n  error: ${event.errorName ?? 'Error'}: ${event.errorMessage}` : '';
          return `${index + 1}. [${event.severity}] ${event.createdAt} ${event.scope}\n  ${event.message}${error}${metadata}`;
        })
        .join('\n')
    : 'No recent diagnostics captured on this device.';

  return [
    'MoneyKai Internal Testing Report',
    `Generated at: ${report.generatedAt}`,
    '',
    'Release',
    formatMap({
      appName: report.release.appName,
      packageName: report.release.packageName,
      appVersion: report.release.appVersion,
      buildProfile: report.release.buildProfile,
      releaseTag: report.release.releaseTag,
      sentryRelease: report.release.sentryRelease,
      sentryDist: report.release.sentryDist,
      featureFlags: JSON.stringify(report.release.featureFlags),
    }),
    '',
    'Device',
    formatMap(report.device),
    '',
    'Capture',
    formatMap(report.capture as unknown as Record<string, unknown>),
    '',
    'Backup and Sync',
    formatMap({
      provider: report.backup.provider,
      syncStatus: report.backup.syncStatus,
      lastSyncedAt: report.backup.lastSyncedAt,
      lastCacheHydratedAt: report.backup.lastCacheHydratedAt,
      pendingSyncCount: report.backup.pendingSyncCount,
      isOnline: report.backup.isOnline,
      automaticBackupPending: report.backup.automaticBackup.pending,
      automaticBackupQueuedAt: report.backup.automaticBackup.queuedAt,
      automaticBackupLastBackupAt: report.backup.automaticBackup.lastBackupAt,
      automaticBackupReason: report.backup.automaticBackup.reason,
    }),
    '',
    'Recent Redacted Diagnostics',
    diagnosticsText,
    '',
    'Privacy',
    'This report excludes account name, email, raw SMS bodies, raw notification payloads, diagnostic stacks, and backup contents.',
  ].join('\n');
};

export const collectInternalTestingReport = async (): Promise<InternalTestingReport> => {
  const nativeStatus = await getNativeCaptureStatus().catch(() => undefined);
  return buildInternalTestingReport({
    release: getReleaseMetadata(),
    device: getDeviceContext(),
    capture: getCaptureContext(nativeStatus),
    backup: await getBackupContext(),
    diagnostics: getRecentDiagnosticEvents(),
  });
};

export const copyInternalTestingReportToClipboard = (reportText: string) => {
  Clipboard.setString(reportText);
};
