import type { SmsImportRangeId, SmsImportRangeOption } from '@/types/smsImport';

export const DEFAULT_SMS_IMPORT_RANGE_ID: SmsImportRangeId = '1_month';

export const SMS_IMPORT_RANGE_OPTIONS: SmsImportRangeOption[] = [
  { id: '15_days', label: '15 days', days: 15, maxMessages: 250, pageSize: 250 },
  { id: '1_month', label: '1 month', days: 31, maxMessages: 500, pageSize: 250 },
  { id: '3_months', label: '3 months', days: 93, maxMessages: 1500, pageSize: 300 },
  { id: '6_months', label: '6 months', days: 186, maxMessages: 3000, pageSize: 300 },
  { id: '1_year', label: '1 year', days: 366, maxMessages: 6000, pageSize: 300 },
  { id: 'all', label: 'ALL', maxMessages: 10000, pageSize: 500 },
];

export const getSmsImportRangeOption = (rangeId?: SmsImportRangeId): SmsImportRangeOption =>
  SMS_IMPORT_RANGE_OPTIONS.find((option) => option.id === rangeId) ??
  SMS_IMPORT_RANGE_OPTIONS.find((option) => option.id === DEFAULT_SMS_IMPORT_RANGE_ID) ??
  SMS_IMPORT_RANGE_OPTIONS[0];
