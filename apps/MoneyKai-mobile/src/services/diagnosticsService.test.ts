import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureDiagnosticEvent,
  clearRecentDiagnosticEvents,
  getRecentDiagnosticEvents,
  sanitizeMetadata,
  setDiagnosticEventSink,
} from './diagnosticsService';

describe('diagnosticsService', () => {
  beforeEach(() => {
    clearRecentDiagnosticEvents();
    setDiagnosticEventSink(undefined);
  });

  it('redacts SMS and notification content fields from metadata', () => {
    expect(
      sanitizeMetadata({
        source: 'sms',
        sender: 'HDFCBK',
        title: 'Debit alert',
        body: 'Rs 100 debited at Merchant',
        rawPayload: {
          body: 'nested SMS body',
          smsAccountHint: 'xx1234',
        },
      })
    ).toEqual({
      source: 'sms',
      sender: '[Redacted]',
      title: '[Redacted]',
      body: '[Redacted]',
      rawPayload: '[Redacted]',
    });
  });

  it('keeps a bounded recent event history and calls an optional sink', () => {
    const sink = vi.fn();
    setDiagnosticEventSink(sink);

    const event = captureDiagnosticEvent({
      scope: 'nativeCapture.status',
      message: 'Native status check failed',
      severity: 'warning',
      metadata: { notificationEnabled: true },
    });

    expect(getRecentDiagnosticEvents()).toHaveLength(1);
    expect(getRecentDiagnosticEvents()[0]).toMatchObject({
      id: event.id,
      scope: 'nativeCapture.status',
      message: 'Native status check failed',
      severity: 'warning',
      metadata: { notificationEnabled: true },
    });
    expect(sink).toHaveBeenCalledWith(event);
  });
});
