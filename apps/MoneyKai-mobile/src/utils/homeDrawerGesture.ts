export function isHomeDrawerSwipe(dx: number, dy: number, direction: 'open' | 'close', minimumDistance: number) {
  const directionalDistance = direction === 'open' ? dx : -dx;
  return directionalDistance > minimumDistance && Math.abs(dx) > Math.abs(dy) * 1.5;
}
