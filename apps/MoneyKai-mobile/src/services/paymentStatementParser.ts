import type { PaymentConnectionId } from '@/constants/paymentConnections';
import type { Transaction } from '@/types/transaction';

export type StatementTransaction = Omit<Transaction, 'id' | 'created_at' | 'user_id'> & { key: string };
export interface PaymentStatementResult {
  rows: StatementTransaction[];
  skippedCount: number;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DATE_SOURCE = '(?:20\\d{2}[-/]\\d{1,2}[-/]\\d{1,2}|\\d{1,2}[-/]\\d{1,2}[-/]20\\d{2}|[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+20\\d{2}|\\d{1,2}[ -][A-Za-z]{3,9}[ ,/-]+20\\d{2})';
const datePattern = new RegExp(`\\b${DATE_SOURCE}\\b`, 'i');
const rowDate = new RegExp(`^${DATE_SOURCE}\\b`, 'i');
const actionStart = /^(?:paid(?:\s+to|\s*-)|received\s+from|sent\s+to|payment\s+to|refund\s+from|cashback\s+from)\b/i;

function parseDate(raw: string): string | undefined {
  let year: number, month: number, day: number;
  const iso = raw.match(/^(20\d{2})[-/](\d{1,2})[-/](\d{1,2})$/);
  const numeric = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](20\d{2})$/);
  const monthFirst = raw.match(/^([a-z]+)\s+(\d{1,2}),?\s+(20\d{2})$/i);
  const dayFirst = raw.match(/^(\d{1,2})[ -]([a-z]+)[ ,/-]+(20\d{2})$/i);
  if (iso) [, year, month, day] = iso.map(Number);
  else if (numeric) [, day, month, year] = numeric.map(Number);
  else if (monthFirst) { year = Number(monthFirst[3]); month = MONTHS.indexOf(monthFirst[1].slice(0, 3).toLowerCase()) + 1; day = Number(monthFirst[2]); }
  else if (dayFirst) { year = Number(dayFirst[3]); month = MONTHS.indexOf(dayFirst[2].slice(0, 3).toLowerCase()) + 1; day = Number(dayFirst[1]); }
  else return undefined;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : undefined;
}

// Opaque deterministic identifiers avoid retaining raw transaction references.
function hash(value: string): string {
  let result = 2166136261;
  let second = 5381;
  for (const char of value) {
    result = Math.imul(result ^ char.charCodeAt(0), 16777619);
    second = Math.imul(second, 33) ^ char.charCodeAt(0);
  }
  return `${(result >>> 0).toString(16)}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

export function parsePaymentStatement(text: string, provider: PaymentConnectionId): PaymentStatementResult {
  if (!text.trim() || text.length > 1_000_000) throw new Error('Choose a readable PDF statement with a shorter date range.');
  const markers: Record<PaymentConnectionId, RegExp> = { google_pay: /google\s*pay|gpay/i, phonepe: /phone\s*pe/i, paytm: /paytm/i };
  const detected = (Object.keys(markers) as PaymentConnectionId[]).find((id) => markers[id].test(text.slice(0, 4000)));
  if (detected && detected !== provider) throw new Error('This statement belongs to a different payment app. Choose its Import statement button.');
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.replace(/[\t ]+/g, ' ').trim()).filter(Boolean);
  const firstDate = lines.findIndex((line) => rowDate.test(line));
  const firstAction = lines.findIndex((line) => actionStart.test(line));
  // Exports have either date-first table rows or description-first payment cards.
  const actionFirst = firstAction >= 0 && (firstDate < 0 || firstAction < firstDate);
  const blocks: string[][] = [];
  let block: string[] = [];
  for (const line of lines) {
    const starts = actionFirst ? actionStart.test(line) : rowDate.test(line);
    if (starts) { if (block.length) blocks.push(block); block = [line]; }
    else if (block.length) block.push(line);
  }
  if (block.length) blocks.push(block);
  const rows: StatementTransaction[] = [];
  const occurrences = new Map<string, number>();
  let skippedCount = 0;
  for (const parts of blocks) {
    const body = parts.join(' ');
    if (!/\b(?:paid|received|sent|payment|debit|credit|refund|cashback)\b/i.test(body)) continue;
    if (/\b(?:failed|pending|cancelled|canceled|self[- ]transfer|transfer to self)\b/i.test(body)) { skippedCount++; continue; }
    const dateMatch = body.match(datePattern);
    const date = dateMatch && parseDate(dateMatch[0]);
    // Explicit type columns take precedence over bank-account metadata.
    const debit = /\bDEBIT\b/i.test(body), credit = /\bCREDIT\b/i.test(body);
    const outgoing = debit || /\b(?:paid|sent|payment to)\b/i.test(body);
    const incoming = credit || /\b(?:received|refund|cashback)\b/i.test(body);
    const type = debit !== credit ? (debit ? 'expense' : 'income') : outgoing !== incoming ? (outgoing ? 'expense' : 'income') : undefined;
    const amountMatch = body.match(/(?:₹|INR\b|Rs\.?\s)\s*([\d,]+(?:\.\d{1,2})?)/i)
      ?? body.match(/\b(?:DEBIT|CREDIT)\s+([\d,]+\.\d{2})\b/i);
    const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : NaN;
    if (!date || !type || !Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) { skippedCount++; continue; }
    const direction = body.match(/\b(?:paid to|sent to|payment to|received from|refund from|cashback from)\s+(.+?)(?=\s+(?:DEBIT\b|CREDIT\b|₹|INR\b|Rs\.?\s|Transaction\s+ID\b|UTR\b|UPI\s+(?:ID|ref)\b|Debited\s+from\b|Credited\s+to\b)|$)/i);
    const description = (direction?.[1] ?? (type === 'expense' ? 'Payment' : 'Money received'))
      .replace(datePattern, '').replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/gi, '')
      .replace(/\S+@\S+/g, '[UPI ID]').replace(/\b\d{8,}\b/g, '[reference]').replace(/\s+/g, ' ').trim().slice(0, 120);
    const reference = body.match(/\b(?:UTR(?:\s+(?:no|number))?|UPI\s+(?:ref(?:erence)?(?:\s+no)?|transaction\s+id)|Transaction\s+ID)\s*[:#-]?\s*([a-z0-9-]{8,})/i)?.[1];
    const signature = reference ? `ref:${hash(reference.toLowerCase())}` : `${date}:${type}:${amount.toFixed(2)}:${hash(description.toLowerCase())}`;
    const occurrence = (occurrences.get(signature) ?? 0) + 1;
    occurrences.set(signature, occurrence);
    const key = `statement:${provider}:${signature}${reference ? '' : `:${occurrence}`}`;
    rows.push({ key, sourceFingerprint: key, captureSource: 'pdf', type, amount, category: type === 'expense' ? 'others' : /refund|cashback/i.test(body) ? 'refund' : 'other_income', description, payment_method: 'upi', transaction_date: date });
  }
  return { rows, skippedCount };
}

export function findStatementDuplicate(row: StatementTransaction, transactions: Transaction[], userId: string): boolean {
  return transactions.some((transaction) => transaction.user_id === userId && transaction.sourceFingerprint === row.sourceFingerprint);
}

export function findPossibleStatementDuplicate(row: StatementTransaction, transactions: Transaction[], userId: string): boolean {
  return transactions.some((transaction) => transaction.user_id === userId && transaction.type === row.type
    && transaction.transaction_date.slice(0, 10) === row.transaction_date && Math.abs(transaction.amount - row.amount) < 0.005);
}
