/** Same width budget drives the moving highlight and every animated tab. */
export function getPillGeometry(contentWidth: number, count: number) {
  const inactiveWidth = Math.max(0, contentWidth) / (Math.max(1, count) + 1.5);
  return { inactiveWidth, activeWidth: inactiveWidth * 2.5 };
}

/** Centre the actual icon/label pair, not a wide label slot. */
export function getPillContentGeometry(activeWidth: number, measuredLabelWidth: number) {
  const iconWidth = 25;
  const gap = 4;
  const padding = 8;
  const labelWidth = Math.min(Math.max(0, measuredLabelWidth), Math.max(0, activeWidth - iconWidth - gap - padding * 2));
  const iconLeft = Math.max(padding, (activeWidth - iconWidth - gap - labelWidth) / 2);
  const labelLeft = iconLeft + iconWidth + gap;
  return { iconLeft, labelLeft, labelSpace: Math.max(0, activeWidth - labelLeft - padding) };
}
