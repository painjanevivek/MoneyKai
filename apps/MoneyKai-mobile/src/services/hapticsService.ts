import { AppState, NativeModules, Platform, Vibration } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

let lastFeedbackAt = 0;
let lastSelectionAt = 0;

/** Selection/tap feedback, distinct from notification vibrations. */
export async function hapticForSelection(): Promise<boolean> {
  if (!useSettingsStore.getState().hapticEnabled || AppState.currentState !== 'active' || Platform.OS !== 'android') return false;
  const now = Date.now();
  if (now - lastSelectionAt < 80) return false;
  lastSelectionAt = now;
  try {
    // A false result means Android declined feedback; never force a vibration over it.
    return Boolean(await NativeModules.MoneyKaiHaptics?.perform('selection'));
  } catch { return false; }
}

/** In-app feedback only. System notifications use their own platform vibration settings. */
export function vibrateForImportantEvent() {
  if (
    !useSettingsStore.getState().hapticEnabled ||
    AppState.currentState !== 'active' ||
    (Platform.OS !== 'android' && Platform.OS !== 'ios')
  ) {
    return;
  }

  const now = Date.now();
  if (now - lastFeedbackAt < 500) {
    return;
  }
  lastFeedbackAt = now;

  // iOS uses the system's fixed vibration duration; Android accepts a shorter pulse.
  try {
    if (Platform.OS === 'android' && NativeModules?.MoneyKaiHaptics?.perform) {
      void NativeModules.MoneyKaiHaptics.perform('confirm').catch(() => undefined);
    } else {
      Vibration.vibrate(Platform.OS === 'android' ? 120 : undefined);
    }
  } catch {
    // A missing/disabled vibration motor must never prevent an alert from appearing.
  }
}
