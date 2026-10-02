import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  appState: { currentState: 'active' },
  platform: { OS: 'android' },
  vibrate: vi.fn(),
  native: {} as { MoneyKaiHaptics?: { perform: ReturnType<typeof vi.fn> } },
  settings: { hapticEnabled: true },
}));

vi.mock('react-native', () => ({
  AppState: mock.appState,
  Platform: mock.platform,
  Vibration: { vibrate: mock.vibrate },
  NativeModules: mock.native,
}));
vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: { getState: () => mock.settings },
}));

import { hapticForSelection, vibrateForImportantEvent } from './hapticsService';

describe('important event haptics', () => {
  beforeEach(() => {
    mock.vibrate.mockClear();
    mock.settings.hapticEnabled = true;
    mock.appState.currentState = 'active';
    mock.platform.OS = 'android';
    delete mock.native.MoneyKaiHaptics;
  });

  it('vibrates once for an enabled foreground event and throttles bursts', () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    vibrateForImportantEvent();
    vibrateForImportantEvent();
    expect(mock.vibrate).toHaveBeenCalledExactlyOnceWith(120);
    vi.restoreAllMocks();
  });

  it('does not vibrate when the preference is off or the app is backgrounded', () => {
    vi.spyOn(Date, 'now').mockReturnValue(11_000);
    mock.settings.hapticEnabled = false;
    vibrateForImportantEvent();
    mock.settings.hapticEnabled = true;
    mock.appState.currentState = 'background';
    vibrateForImportantEvent();
    expect(mock.vibrate).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('uses the system vibration duration on iOS', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12_000);
    mock.platform.OS = 'ios';
    vibrateForImportantEvent();
    expect(mock.vibrate).toHaveBeenCalledExactlyOnceWith(undefined);
    vi.restoreAllMocks();
  });
  it('dispatches real Android touch feedback and throttles repeated taps', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(20_000);
    const perform = vi.fn().mockResolvedValue(true); mock.native.MoneyKaiHaptics = { perform };
    expect(await hapticForSelection()).toBe(true); expect(await hapticForSelection()).toBe(false);
    expect(perform).toHaveBeenCalledExactlyOnceWith('selection'); expect(mock.vibrate).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  it('never forces vibration when Android declines touch feedback', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(21_000);
    mock.native.MoneyKaiHaptics = { perform: vi.fn().mockResolvedValue(false) };
    expect(await hapticForSelection()).toBe(false); expect(mock.vibrate).not.toHaveBeenCalled();
    mock.settings.hapticEnabled = false; expect(await hapticForSelection()).toBe(false);
    mock.settings.hapticEnabled = true; mock.appState.currentState = 'background'; expect(await hapticForSelection()).toBe(false);
    expect(mock.native.MoneyKaiHaptics.perform).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
  it('uses native confirmation for important Android events and handles bridge errors', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(22_000);
    mock.native.MoneyKaiHaptics = { perform: vi.fn().mockRejectedValue(new Error('Unavailable')) };
    vibrateForImportantEvent(); expect(await hapticForSelection()).toBe(false);
    expect(mock.native.MoneyKaiHaptics.perform).toHaveBeenCalledWith('confirm'); expect(mock.vibrate).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
