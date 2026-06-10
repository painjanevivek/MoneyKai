import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticEvent, DiagnosticEventSink } from './diagnosticsService';

const mocks = vi.hoisted(() => ({
  createDiagnosticEvent: vi.fn(),
  isBackendConfigured: vi.fn(),
  setDiagnosticEventSink: vi.fn(),
}));

vi.mock('@/services/backendApi', () => ({
  backendApi: {
    createDiagnosticEvent: mocks.createDiagnosticEvent,
  },
  isBackendConfigured: mocks.isBackendConfigured,
}));

vi.mock('@/services/diagnosticsService', () => ({
  setDiagnosticEventSink: mocks.setDiagnosticEventSink,
}));

const event = (severity: DiagnosticEvent['severity']): DiagnosticEvent => ({
  id: `event-${severity}`,
  createdAt: '2026-06-11T00:00:00.000Z',
  scope: 'nativeCapture.status',
  message: 'Native capture status failed',
  severity,
  platform: 'android',
});

describe('diagnosticsUploadService', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createDiagnosticEvent.mockReset();
    mocks.isBackendConfigured.mockReset();
    mocks.setDiagnosticEventSink.mockReset();
    mocks.isBackendConfigured.mockReturnValue(true);
  });

  it('uploads warning, error, and fatal diagnostics when backend is configured', async () => {
    const { installDiagnosticsUploadSink } = await import('./diagnosticsUploadService');
    installDiagnosticsUploadSink();

    const sink = mocks.setDiagnosticEventSink.mock.calls[0][0] as DiagnosticEventSink;
    await sink(event('error'));

    expect(mocks.createDiagnosticEvent).toHaveBeenCalledWith(event('error'));
  });

  it('skips info diagnostics and unconfigured backends', async () => {
    const { installDiagnosticsUploadSink } = await import('./diagnosticsUploadService');
    installDiagnosticsUploadSink();

    const sink = mocks.setDiagnosticEventSink.mock.calls[0][0] as DiagnosticEventSink;
    await sink(event('info'));
    mocks.isBackendConfigured.mockReturnValue(false);
    await sink(event('fatal'));

    expect(mocks.createDiagnosticEvent).not.toHaveBeenCalled();
  });
});
