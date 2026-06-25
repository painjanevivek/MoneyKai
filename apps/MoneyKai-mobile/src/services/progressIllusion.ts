import type { SmsImportProgress } from '@/types/smsImport';

export type ProgressFlowStatus = 'running' | 'success' | 'failed' | 'background';
export type ProgressStepStatus = 'pending' | 'active' | 'complete' | 'failed';

export interface ProgressFlowStep {
  id: string;
  title: string;
  description?: string;
  status: ProgressStepStatus;
}

export interface ProgressFlowState {
  title: string;
  currentStep: string;
  progress: number;
  status: ProgressFlowStatus;
  steps: ProgressFlowStep[];
  detail?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const perceivedProgress = ({
  complete,
  failed,
  floor,
  ceiling = 88,
  signal = 0,
}: {
  complete?: boolean;
  failed?: boolean;
  floor: number;
  ceiling?: number;
  signal?: number;
}) => {
  if (complete) {
    return 100;
  }
  if (failed) {
    return clamp(floor, 0, 95);
  }
  return clamp(floor + signal, floor, ceiling);
};

export const buildSmsImportProgressFlow = (
  progress?: SmsImportProgress,
  failedMessage?: string,
): ProgressFlowState => {
  const failed = Boolean(failedMessage);
  const isComplete = progress?.phase === 'complete' && !failed;
  const phase = progress?.phase;
  const scannedSignal = Math.min(progress?.pageCount ?? 0, 8) * 4 + Math.min(progress?.scannedCount ?? 0, 120) / 12;
  const importSignal =
    Math.min(progress?.eligibleCount ?? 0, 80) / 3 +
    Math.min(progress?.draftedCount ?? 0, 40) / 2 +
    Math.min(progress?.duplicateCount ?? 0, 40) / 4;

  const currentStep =
    failed
      ? 'review'
      : isComplete
        ? 'review'
        : phase === 'importing_transactions'
          ? 'draft'
          : phase === 'discovering_accounts'
            ? 'scan'
            : 'permission';

  const progressValue =
    currentStep === 'permission'
      ? perceivedProgress({ floor: 18, ceiling: 32, failed })
      : currentStep === 'scan'
        ? perceivedProgress({ floor: 34, ceiling: 62, signal: scannedSignal, failed })
        : currentStep === 'draft'
          ? perceivedProgress({ floor: 62, ceiling: 88, signal: importSignal, failed })
          : perceivedProgress({ floor: 88, complete: isComplete, failed });

  const stepStatus = (id: string): ProgressStepStatus => {
    if (failed && id === currentStep) return 'failed';
    if (isComplete) return 'complete';
    const order = ['permission', 'scan', 'draft', 'review'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(id);
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return {
    title: isComplete ? 'SMS import complete' : failed ? 'SMS import needs attention' : 'Importing SMS',
    currentStep:
      failed
        ? failedMessage ?? 'Import failed.'
        : progress?.message ??
          (isComplete
            ? 'Review drafts before they affect your budget.'
            : 'Scanning approved bank SMS in small batches.'),
    progress: progressValue,
    status: failed ? 'failed' : isComplete ? 'success' : 'running',
    detail:
      progress
        ? `${progress.scannedCount} scanned | ${progress.eligibleCount} eligible | ${progress.draftedCount} drafts | ${progress.duplicateCount} duplicates`
        : undefined,
    steps: [
      {
        id: 'permission',
        title: 'Request access',
        description: 'Use only the approved SMS range and selected accounts.',
        status: stepStatus('permission'),
      },
      {
        id: 'scan',
        title: 'Scan messages',
        description: 'Find likely bank and payment transaction SMS.',
        status: stepStatus('scan'),
      },
      {
        id: 'draft',
        title: 'Create drafts',
        description: 'Convert matches into reviewable transaction drafts.',
        status: stepStatus('draft'),
      },
      {
        id: 'review',
        title: 'Ready for review',
        description: 'Keep drafts separate until you approve categories.',
        status: stepStatus('review'),
      },
    ],
  };
};
