import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import type { Transaction, TransactionType } from '@/types/transaction';

export type StatementFileLike = {
  name: string;
  size?: number;
  type?: string;
  text?: () => Promise<string>;
};

export type StatementExtractionStatus = 'ready' | 'review' | 'unsupported';

export type StatementDraftTransaction = Omit<Transaction, 'id' | 'created_at'> & {
  source_file: string;
  source_account: string;
  raw_description: string;
  confidence: number;
  import_note: string;
};

export type StatementImportResult = {
  fileName: string;
  fileType: string;
  accountLabel: string;
  status: StatementExtractionStatus;
  message: string;
  extractedTextPreview: string;
  drafts: StatementDraftTransaction[];
  ignoredRows: string[];
};

type DelimitedRow = string[];

type HeaderMap = {
  date?: number;
  description?: number;
  amount?: number;
  debit?: number;
  credit?: number;
  type?: number;
  payment?: number;
  balance?: number;
};

const EXPENSE_KEYWORDS: { category: string; terms: string[] }[] = [
  { category: 'food', terms: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'pizza', 'food', 'dining', 'bakery'] },
  { category: 'shopping', terms: ['amazon', 'flipkart', 'myntra', 'store', 'mart', 'basket', 'mall', 'shopping', 'retail'] },
  { category: 'transport', terms: ['uber', 'ola', 'metro', 'fuel', 'petrol', 'diesel', 'taxi', 'bus', 'rail', 'parking'] },
  { category: 'rent', terms: ['rent', 'housing', 'landlord', 'lease'] },
  { category: 'education', terms: ['school', 'college', 'course', 'tuition', 'udemy', 'book'] },
  { category: 'entertainment', terms: ['netflix', 'spotify', 'movie', 'game', 'bookmyshow', 'entertainment'] },
  { category: 'bills', terms: ['recharge', 'electricity', 'bill', 'broadband', 'mobile', 'utility', 'gas', 'dth'] },
  { category: 'healthcare', terms: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'medicine'] },
];

const INCOME_KEYWORDS: { category: string; terms: string[] }[] = [
  { category: 'allowance', terms: ['salary', 'payroll', 'credited by employer', 'stipend', 'allowance'] },
  { category: 'freelance', terms: ['freelance', 'invoice', 'client', 'consulting'] },
  { category: 'bonus', terms: ['bonus', 'reward', 'incentive'] },
  { category: 'refund', terms: ['refund', 'cashback', 'reversal', 'chargeback'] },
];

const validExpenseCategories = new Set(EXPENSE_CATEGORIES.map((category) => category.id));
const validIncomeCategories = new Set(INCOME_CATEGORIES.map((category) => category.id));
type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];
const validPaymentMethods = new Set<PaymentMethodId>(PAYMENT_METHODS.map((method) => method.id));
const isPaymentMethodId = (value?: string): value is PaymentMethodId =>
  typeof value === 'string' && validPaymentMethods.has(value as PaymentMethodId);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeRawText = (value: string) =>
  value
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractPdfTextFragments = (value: string) => {
  const fragments = [...value.matchAll(/\(([^()]{3,160})\)\s*(?:Tj|TJ|'|")/g)]
    .map((match) => match[1].replace(/\\([()\\])/g, '$1'))
    .filter((fragment) => /[a-z0-9]/i.test(fragment));

  return fragments.length > 0 ? fragments.join('\n') : value;
};

const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() ?? '';

const getFileTypeLabel = (fileName: string, mimeType = '') => {
  const extension = getFileExtension(fileName);
  if (extension === 'pdf' || mimeType.includes('pdf')) return 'PDF statement';
  if (['doc', 'docx'].includes(extension) || mimeType.includes('word')) return 'Word statement';
  if (['xls', 'xlsx'].includes(extension) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel statement';
  if (['csv', 'tsv'].includes(extension) || mimeType.includes('csv')) return 'Spreadsheet export';
  return extension ? `${extension.toUpperCase()} statement` : 'Document statement';
};

const detectAccountLabel = (text: string, fileName: string) => {
  const accountMatch =
    text.match(/\b(?:account|a\/c|acct)\s*(?:no\.?|number|ending|xx)?\s*[:#-]?\s*([xX*\d -]{4,24})/i) ??
    text.match(/\b(?:ending|xx|x{2,})\s*([0-9]{3,6})\b/i);

  if (accountMatch?.[1]) {
    return `Account ${normalizeWhitespace(accountMatch[1]).replace(/\s+/g, ' ')}`;
  }

  const bankName = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(statement|bank|account|transactions|export)\b/gi, '')
    .trim();

  return bankName ? `${bankName} account` : 'Bank account';
};

const parseMoney = (value: string | undefined) => {
  if (!value) return undefined;
  const cleaned = value
    .replace(/(?:inr|rs\.?|rupees?|\u20b9)/gi, '')
    .replace(/[,\s]/g, '')
    .replace(/[()]/g, '')
    .trim();
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
};

const normalizeDate = (value: string | undefined) => {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/,/g, '');
  const iso = cleaned.match(/\b(20\d{2}|19\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  const dayFirst = cleaned.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|19\d{2}|\d{2})\b/);
  if (dayFirst) {
    const year = dayFirst[3].length === 2 ? `20${dayFirst[3]}` : dayFirst[3];
    return `${year}-${dayFirst[2].padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`;
  }

  const monthNames: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };
  const named = cleaned.match(/\b(\d{1,2})\s+([a-z]{3,})\s+(20\d{2}|19\d{2})\b/i);
  const month = named ? monthNames[named[2].slice(0, 3).toLowerCase()] : undefined;
  if (named && month) {
    return `${named[3]}-${month}-${named[1].padStart(2, '0')}`;
  }

  return undefined;
};

const inferTransactionType = (text: string, debit?: number, credit?: number): TransactionType | undefined => {
  if (credit && !debit) return 'income';
  if (debit && !credit) return 'expense';

  if (/\b(cr|credit|credited|deposit|deposited|received|salary|refund|cashback)\b/i.test(text)) {
    return 'income';
  }
  if (/\b(dr|debit|debited|withdrawal|withdrawn|paid|sent|purchase|spent|upi\/p2m|pos)\b/i.test(text)) {
    return 'expense';
  }
  return undefined;
};

const detectPaymentMethod = (description: string): PaymentMethodId => {
  const lowered = description.toLowerCase();
  if (/\bupi\b|@[a-z][a-z0-9.-]+\b|vpa/.test(lowered)) return 'upi';
  if (/\bcard\b|pos|visa|mastercard|credit card|debit card/.test(lowered)) return 'card';
  if (/\bwallet\b|paytm|phonepe/.test(lowered)) return 'wallet';
  if (/\bcash\b|atm withdrawal/.test(lowered)) return 'cash';
  return validPaymentMethods.has('bank') ? 'bank' : PAYMENT_METHODS[0].id;
};

const categorize = (description: string, type: TransactionType) => {
  const lowered = description.toLowerCase();
  const rules = type === 'income' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
  const match = rules.find((rule) => rule.terms.some((term) => lowered.includes(term)));
  const fallback = type === 'income' ? 'other_income' : 'others';
  const category = match?.category ?? fallback;

  if (type === 'income' && !validIncomeCategories.has(category)) return fallback;
  if (type === 'expense' && !validExpenseCategories.has(category)) return fallback;
  return category;
};

const splitDelimitedLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const parseDelimitedRows = (text: string): DelimitedRow[] => {
  const candidates = [',', '\t', ';'];
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const delimiter = candidates
    .map((candidate) => ({
      candidate,
      score: lines.slice(0, 12).reduce((sum, line) => sum + Math.max(0, splitDelimitedLine(line, candidate).length - 1), 0),
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate ?? ',';

  if (lines.length === 0 || splitDelimitedLine(lines[0], delimiter).length < 3) return [];
  return lines.map((line) => splitDelimitedLine(line, delimiter)).filter((row) => row.length >= 3);
};

const buildHeaderMap = (row: DelimitedRow): HeaderMap => {
  const map: HeaderMap = {};
  row.forEach((cell, index) => {
    const header = cell.toLowerCase();
    if (map.date === undefined && /\b(date|txn date|transaction date|value date)\b/.test(header)) map.date = index;
    if (map.description === undefined && /\b(description|narration|details|particulars|merchant|remarks)\b/.test(header)) map.description = index;
    if (map.amount === undefined && /\b(amount|transaction amount)\b/.test(header) && !/\b(balance|debit|credit)\b/.test(header)) map.amount = index;
    if (map.debit === undefined && /\b(debit|withdrawal|paid|dr)\b/.test(header)) map.debit = index;
    if (map.credit === undefined && /\b(credit|deposit|received|cr)\b/.test(header)) map.credit = index;
    if (map.type === undefined && /\b(type|direction|dr\/cr|debit\/credit)\b/.test(header)) map.type = index;
    if (map.payment === undefined && /\b(mode|method|channel|payment)\b/.test(header)) map.payment = index;
    if (map.balance === undefined && /\bbalance\b/.test(header)) map.balance = index;
  });
  return map;
};

const looksLikeHeader = (row: DelimitedRow) => {
  const text = row.join(' ').toLowerCase();
  return /\bdate\b/.test(text) && /\b(amount|debit|credit|withdrawal|deposit|narration|description)\b/.test(text);
};

const cleanDescription = (value: string) =>
  normalizeWhitespace(
    value
      .replace(/\b(?:utr|rrn|ref|reference|txn(?: id)?|transaction id)\s*[:#-]?\s*[a-z0-9/-]{5,}/gi, '')
      .replace(/\b(?:available balance|closing balance|balance)\b.*$/gi, '')
      .replace(/[|]{2,}/g, '|')
  ) || 'Bank statement transaction';

const createDraft = (params: {
  userId: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  accountLabel: string;
  fileName: string;
  confidence: number;
  note: string;
  paymentMethod?: string;
}): StatementDraftTransaction => {
  const description = cleanDescription(params.description);
  return {
    user_id: params.userId,
    type: params.type,
    amount: Math.round(params.amount * 100) / 100,
    category: categorize(description, params.type),
    description,
    payment_method: isPaymentMethodId(params.paymentMethod) ? params.paymentMethod : detectPaymentMethod(description),
    transaction_date: params.date,
    source_file: params.fileName,
    source_account: params.accountLabel,
    raw_description: params.description,
    confidence: params.confidence,
    import_note: params.note,
  };
};

const parseFromDelimitedRows = (rows: DelimitedRow[], accountLabel: string, fileName: string, userId: string) => {
  const headerIndex = rows.findIndex(looksLikeHeader);
  if (headerIndex < 0) return [];

  const headers = buildHeaderMap(rows[headerIndex]);
  if (headers.date === undefined || headers.description === undefined) return [];

  return rows.slice(headerIndex + 1).flatMap((row) => {
    const date = normalizeDate(row[headers.date ?? -1]);
    const description = row[headers.description ?? -1];
    const debit = parseMoney(row[headers.debit ?? -1]);
    const credit = parseMoney(row[headers.credit ?? -1]);
    const amount = debit ?? credit ?? parseMoney(row[headers.amount ?? -1]);
    const directionText = `${row[headers.type ?? -1] ?? ''} ${description ?? ''}`;
    const type = inferTransactionType(directionText, debit, credit);

    if (!date || !description || !amount || !type) return [];

    return createDraft({
      userId,
      date,
      description,
      amount,
      type,
      accountLabel,
      fileName,
      confidence: headers.debit !== undefined || headers.credit !== undefined ? 0.92 : 0.82,
      note: 'Mapped from statement columns',
      paymentMethod: row[headers.payment ?? -1]?.toLowerCase(),
    });
  });
};

const parseFromLooseLines = (text: string, accountLabel: string, fileName: string, userId: string) => {
  const drafts: StatementDraftTransaction[] = [];
  const ignoredRows: string[] = [];
  const datePattern = /\b(?:20\d{2}|19\d{2})[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.](?:20\d{2}|19\d{2}|\d{2})\b|\b\d{1,2}\s+[a-z]{3,}\s+(?:20\d{2}|19\d{2})\b/i;
  const amountPattern = /(?:inr|rs\.?|rupees?|\u20b9)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(cr|dr)?\b/gi;

  text.split('\n').forEach((rawLine) => {
    const line = normalizeWhitespace(rawLine);
    if (line.length < 12) return;

    const dateMatch = line.match(datePattern);
    const date = normalizeDate(dateMatch?.[0]);
    if (!date) return;

    const lineWithoutDate = line.replace(dateMatch?.[0] ?? '', ' ');
    const amounts = [...lineWithoutDate.matchAll(amountPattern)]
      .map((match) => ({ amount: parseMoney(match[1]), marker: match[2]?.toLowerCase(), raw: match[0] }))
      .filter((match) => match.amount !== undefined && match.amount < 100000000) as { amount: number; marker?: string; raw: string }[];

    const amountMatch = amounts.find((match) => match.marker) ?? amounts[0];
    const type = inferTransactionType(`${line} ${amountMatch?.marker ?? ''}`);
    if (!amountMatch?.amount || !type) {
      ignoredRows.push(line);
      return;
    }

    const description = cleanDescription(lineWithoutDate.replace(amountMatch.raw, ' '));
    drafts.push(createDraft({
      userId,
      date,
      description,
      amount: amountMatch.amount,
      type,
      accountLabel,
      fileName,
      confidence: amountMatch.marker ? 0.78 : 0.68,
      note: 'Detected from OCR-style line scan',
    }));
  });

  return { drafts, ignoredRows };
};

const removeDuplicateDrafts = (drafts: StatementDraftTransaction[]) => {
  const seen = new Set<string>();
  return drafts.filter((draft) => {
    const key = [
      draft.transaction_date,
      draft.type,
      draft.amount.toFixed(2),
      draft.description.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32),
    ].join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const isLikelyDuplicate = (draft: StatementDraftTransaction, transactions: Transaction[]) => {
  const draftDescription = draft.description.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28);
  return transactions.some((transaction) => {
    const description = transaction.description.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28);
    return (
      transaction.transaction_date === draft.transaction_date &&
      transaction.type === draft.type &&
      Math.abs(transaction.amount - draft.amount) < 0.01 &&
      description === draftDescription
    );
  });
};

export const processStatementFile = async (file: StatementFileLike, userId: string): Promise<StatementImportResult> => {
  const fileName = file.name || 'statement';
  const fileType = getFileTypeLabel(fileName, file.type);
  const extension = getFileExtension(fileName);

  if (!file.text) {
    return {
      fileName,
      fileType,
      accountLabel: detectAccountLabel('', fileName),
      status: 'unsupported',
      message: 'This browser did not expose readable file text for the selected document.',
      extractedTextPreview: '',
      drafts: [],
      ignoredRows: [],
    };
  }

  const rawText = await file.text();
  const text = normalizeRawText(extension === 'pdf' ? extractPdfTextFragments(rawText) : rawText);
  const accountLabel = detectAccountLabel(text, fileName);
  const rows = parseDelimitedRows(text);
  const tableDrafts = parseFromDelimitedRows(rows, accountLabel, fileName, userId);
  const loose = parseFromLooseLines(text, accountLabel, fileName, userId);
  const drafts = removeDuplicateDrafts([...tableDrafts, ...loose.drafts]);
  const binaryOnly = text.length < 40 || text.replace(/[^a-z0-9]/gi, '').length < 20;

  if (drafts.length === 0) {
    const binaryMessage = ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension)
      ? 'The file was accepted, but its text layer was not readable in the browser. Scanned PDFs and compressed Word or Excel files need a server OCR pass before import.'
      : 'No bank-statement rows were detected. Try an exported CSV/TSV or a statement with selectable text.';

    return {
      fileName,
      fileType,
      accountLabel,
      status: binaryOnly ? 'unsupported' : 'review',
      message: binaryMessage,
      extractedTextPreview: text.slice(0, 420),
      drafts: [],
      ignoredRows: loose.ignoredRows.slice(0, 6),
    };
  }

  const reviewCount = drafts.filter((draft) => draft.confidence < 0.75 || draft.category === 'others' || draft.category === 'other_income').length;

  return {
    fileName,
    fileType,
    accountLabel,
    status: reviewCount > 0 ? 'review' : 'ready',
    message: reviewCount > 0
      ? `${drafts.length} rows extracted. ${reviewCount} should be reviewed before importing.`
      : `${drafts.length} rows extracted and categorized.`,
    extractedTextPreview: text.slice(0, 420),
    drafts,
    ignoredRows: loose.ignoredRows.slice(0, 6),
  };
};

export const summarizeStatementDrafts = (drafts: StatementDraftTransaction[]) => {
  const income = drafts.filter((draft) => draft.type === 'income').reduce((sum, draft) => sum + draft.amount, 0);
  const expense = drafts.filter((draft) => draft.type === 'expense').reduce((sum, draft) => sum + draft.amount, 0);
  const categoryTotals = drafts.reduce<Record<string, number>>((totals, draft) => {
    totals[draft.category] = (totals[draft.category] ?? 0) + draft.amount;
    return totals;
  }, {});

  return {
    income,
    expense,
    net: income - expense,
    categoryTotals,
  };
};
