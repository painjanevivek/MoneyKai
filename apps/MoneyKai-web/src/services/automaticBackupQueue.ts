import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTO_BACKUP_STATE_KEY = 'moneykai-auto-backup-state';
const AUTO_BACKUP_DEBOUNCE_MS = 10_000;
export const AUTO_BACKUP_MIN_INTERVAL_MS = 60_000;

export interface AutomaticBackupState {
  pending: boolean;
  sequence: number;
  queuedAt: number | null;
  lastBackupAt: number | null;
  reason: string | null;
}

const DEFAULT_AUTOMATIC_BACKUP_STATE: AutomaticBackupState = {
  pending: false,
  sequence: 0,
  queuedAt: null,
  lastBackupAt: null,
  reason: null,
};

let automaticBackupState: AutomaticBackupState | null = null;
let automaticBackupTimer: ReturnType<typeof setTimeout> | null = null;

export const loadAutomaticBackupState = async (): Promise<AutomaticBackupState> => {
  if (automaticBackupState) {
    return automaticBackupState;
  }

  try {
    const raw = await AsyncStorage.getItem(AUTO_BACKUP_STATE_KEY);
    automaticBackupState = raw
      ? { ...DEFAULT_AUTOMATIC_BACKUP_STATE, ...(JSON.parse(raw) as Partial<AutomaticBackupState>) }
      : { ...DEFAULT_AUTOMATIC_BACKUP_STATE };
  } catch {
    automaticBackupState = { ...DEFAULT_AUTOMATIC_BACKUP_STATE };
  }

  return automaticBackupState;
};

const persistAutomaticBackupState = async () => {
  if (!automaticBackupState) {
    return;
  }

  await AsyncStorage.setItem(AUTO_BACKUP_STATE_KEY, JSON.stringify(automaticBackupState));
};

export const clearAutomaticBackupTimer = () => {
  if (automaticBackupTimer) {
    clearTimeout(automaticBackupTimer);
    automaticBackupTimer = null;
  }
};

export const scheduleAutomaticBackup = (flush: () => void) => {
  clearAutomaticBackupTimer();
  automaticBackupTimer = setTimeout(() => {
    automaticBackupTimer = null;
    flush();
  }, AUTO_BACKUP_DEBOUNCE_MS);
};

export const clearAutomaticBackupQueue = async () => {
  const state = await loadAutomaticBackupState();
  automaticBackupState = {
    ...state,
    pending: false,
    queuedAt: null,
    reason: null,
    sequence: state.sequence + 1,
  };
  await persistAutomaticBackupState();
  clearAutomaticBackupTimer();
};

export const markAutomaticBackupRequested = async (reason: string) => {
  const state = await loadAutomaticBackupState();
  automaticBackupState = {
    ...state,
    pending: true,
    queuedAt: Date.now(),
    reason,
    sequence: state.sequence + 1,
  };
  await persistAutomaticBackupState();
};

export const markAutomaticBackupSaved = async (sequenceAtStart: number) => {
  const latestState = await loadAutomaticBackupState();
  if (latestState.sequence !== sequenceAtStart) {
    return false;
  }

  automaticBackupState = {
    ...latestState,
    pending: false,
    queuedAt: null,
    reason: null,
    lastBackupAt: Date.now(),
    sequence: latestState.sequence + 1,
  };
  await persistAutomaticBackupState();
  clearAutomaticBackupTimer();
  return true;
};
