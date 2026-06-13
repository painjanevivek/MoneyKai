const SMS_REFERENCE_PATTERN =
  /\b((?:upi\s*)?(?:ref(?:erence)?|refno|rrn|utr|transaction id|txn id|order id|imps(?:\s*ref)?)\s*(?:no\.?|number|id)?\s*[:#-]?)\s*[a-z0-9/-]{6,}/gi;

export const redactSensitiveSmsText = (value: string): string =>
  value
    .replace(/\b\d{6}\b/g, '[code]')
    .replace(/\b(?:xx|x{2,})\d+\b/gi, '[masked]')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\b/gi, '[vpa]')
    .replace(SMS_REFERENCE_PATTERN, '$1[ref]')
    .replace(/\b\d{8,}\b/g, '[number]');

export const containsLikelyRawSmsIdentifier = (value: string): boolean =>
  /\b\d{8,}\b/.test(value) ||
  /\b\d{6}\b/.test(value) ||
  /\b(?:xx|x{2,})\d+\b/i.test(value) ||
  /[a-z0-9._%+-]+@[a-z0-9.-]+\b/i.test(value);
