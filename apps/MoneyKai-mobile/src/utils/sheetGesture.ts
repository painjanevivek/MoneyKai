export type SheetGestureResult = 'dismiss' | 'expand' | 'restore';

export function isVerticalSheetDrag(dx: number, dy: number, touches = 1): boolean {
  return touches === 1 && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.2;
}

/** Down always dismisses, including from full screen; tiny/sideways moves restore. */
export function resolveSheetGesture(dx: number, dy: number, vy: number, canExpand: boolean, expansionRoom = Infinity): SheetGestureResult {
  if (!isVerticalSheetDrag(dx, dy)) return 'restore';
  if (dy >= 90 || (dy > 8 && vy > 0.65)) return 'dismiss';
  const expansionThreshold = Math.min(48, Math.max(8, expansionRoom / 2));
  if (canExpand && (dy <= -expansionThreshold || (dy < -8 && vy < -0.65))) return 'expand';
  return 'restore';
}

export function sheetDragFrame(startHeight: number, fullHeight: number, dy: number) {
  const start = Math.max(1, Math.min(startHeight, fullHeight));
  return { height: Math.min(fullHeight, start + Math.max(0, -dy)), translateY: Math.max(0, dy) };
}
