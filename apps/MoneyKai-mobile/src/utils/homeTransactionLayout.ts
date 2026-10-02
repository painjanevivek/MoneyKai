/** Long amounts get their own line rather than consuming the description's width. */
export const shouldStackHomeTransaction = (width: number, fontScale: number, amount: string) =>
  width < 360 || fontScale > 1.3 || amount.length >= 14;
