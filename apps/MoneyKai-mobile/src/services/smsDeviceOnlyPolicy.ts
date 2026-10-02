/** Inbox- and notification-derived data must never leave the device. */
export const isDeviceOnlyCaptureSource = (source: unknown): boolean => source === 'sms' || source === 'notification';
export function containsDeviceOnlyData(value: unknown, seen = new Set<object>()): boolean {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some(item => containsDeviceOnlyData(item, seen));
  const record = value as Record<string, unknown>;
  if (isDeviceOnlyCaptureSource(record.captureSource) || isDeviceOnlyCaptureSource(record.source) || record.localOnly === true) return true;
  return Object.values(record).some(item => containsDeviceOnlyData(item, seen));
}
export function assertCloudPayloadAllowed(value: unknown): void {
  if (containsDeviceOnlyData(value)) throw new Error('Device-only financial data cannot be sent to the cloud.');
}
export function assertCloudRouteAllowed(path: string, body?: unknown): void {
  if (path.split('?')[0].replace(/\/$/, '') === '/v1/capture/ai-parse') {
    throw new Error('Cloud SMS parsing is disabled. Use the offline on-device parser.');
  }
  if (typeof body === 'string' && body.length) {
    // All ordinary backend writes use JSON. Malformed JSON must not bypass the guard.
    assertCloudPayloadAllowed(JSON.parse(body));
  }
}
