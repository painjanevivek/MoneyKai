import { describe, expect, it, vi } from 'vitest';
import { runPermissionFlow } from './permissionFlow';

describe('permission dialog coordination', () => {
  it('shares one request across a burst of taps', async () => {
    let finish!: (result: string) => void;
    const request = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const tasks = Array.from({ length: 20 }, () => runPermissionFlow('burst', request));
    await Promise.resolve();
    expect(request).toHaveBeenCalledOnce();
    finish('granted');
    expect(await Promise.all(tasks)).toEqual(Array(20).fill('granted'));
  });
  it('serializes different permission dialogs', async () => {
    let finish!: () => void;
    const first = runPermissionFlow('first', () => new Promise<void>((resolve) => { finish = resolve; }));
    const next = vi.fn(async () => 'denied');
    const second = runPermissionFlow('second', next);
    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
    finish(); await first; await second;
    expect(next).toHaveBeenCalledOnce();
  });
  it('does not retain grant, denial, or errors between actions', async () => {
    const action = vi.fn().mockResolvedValueOnce('granted').mockResolvedValueOnce('denied').mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('granted');
    expect(await runPermissionFlow('live', action)).toBe('granted');
    expect(await runPermissionFlow('live', action)).toBe('denied');
    await expect(runPermissionFlow('live', action)).rejects.toThrow('offline');
    expect(await runPermissionFlow('live', action)).toBe('granted');
    expect(action).toHaveBeenCalledTimes(4);
  });
});
