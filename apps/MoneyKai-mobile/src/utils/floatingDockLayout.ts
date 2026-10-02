/** Shared geometry for the floating dock and the scroll content underneath it. */
export function getFloatingDockLayout(fontScale: number, bottomInset: number, basicMode: boolean) {
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const inset = Number.isFinite(bottomInset) ? Math.max(0, bottomInset) : 0;
  const largeText = scale > 1.3;
  const rows = largeText && !basicMode ? 2 : 1;
  const rowGap = rows > 1 ? 4 : 0;
  const tabMinHeight = largeText ? 31 + 16 * Math.min(scale, 2) : basicMode ? 48 : 54;
  const barPadding = basicMode ? 4 : 6;
  const bottomOffset = Math.max(inset, 12) + 6;
  // Include the border and a 16dp breathing gap above the dock's top edge.
  const contentPaddingBottom = Math.ceil(tabMinHeight * rows + rowGap + barPadding * 2 + bottomOffset + 1 + 16);
  return { largeText, rows, rowGap, tabMinHeight, barPadding, bottomOffset, contentPaddingBottom };
}
