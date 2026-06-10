import { backendApi, isBackendConfigured } from '@/services/backendApi';
import { setDiagnosticEventSink, type DiagnosticEvent } from '@/services/diagnosticsService';

const MAX_IN_FLIGHT_UPLOADS = 2;
const UPLOADABLE_SEVERITIES = new Set<DiagnosticEvent['severity']>(['warning', 'error', 'fatal']);

let installed = false;
let inFlightUploads = 0;

const shouldUploadDiagnostic = (event: DiagnosticEvent) =>
  isBackendConfigured() && UPLOADABLE_SEVERITIES.has(event.severity);

export const installDiagnosticsUploadSink = () => {
  if (installed) {
    return;
  }

  installed = true;
  setDiagnosticEventSink(async (event) => {
    if (!shouldUploadDiagnostic(event) || inFlightUploads >= MAX_IN_FLIGHT_UPLOADS) {
      return;
    }

    inFlightUploads += 1;
    try {
      await backendApi.createDiagnosticEvent(event);
    } finally {
      inFlightUploads = Math.max(0, inFlightUploads - 1);
    }
  });
};
