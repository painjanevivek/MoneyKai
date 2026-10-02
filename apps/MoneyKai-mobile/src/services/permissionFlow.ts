// Deduplicate rapid taps, and keep different OS permission dialogs from overlapping.
// Never cache a granted result: each new action must check the live OS state.
const pending = new Map<string, Promise<unknown>>();
let tail: Promise<unknown> = Promise.resolve();

export function runPermissionFlow<T>(key: string, action: () => Promise<T>): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const task = tail.then(action);
  pending.set(key, task);
  tail = task.catch(() => undefined);
  const clear = () => { if (pending.get(key) === task) pending.delete(key); };
  void task.then(clear, clear);
  return task;
}
