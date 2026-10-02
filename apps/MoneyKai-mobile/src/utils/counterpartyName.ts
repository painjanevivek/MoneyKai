import type { Transaction } from '@/types/transaction';

/** Abbreviate only middle names. Stored names and surnames are never truncated. */
export function compactPersonName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 3) return name;
  // Keep common compound-surname particles with the final surname.
  let surnameStart = parts.length - 1;
  while (surnameStart > 1 && /^(?:de|del|der|da|di|van|von|bin|al|dos|das)$/i.test(parts[surnameStart - 1])) surnameStart -= 1;
  return [parts[0], ...parts.slice(1, surnameStart).map((part) => `${Array.from(part)[0]}.`), ...parts.slice(surnameStart)].join(' ');
}

export function transactionDisplayName(transaction: Pick<Transaction, 'description' | 'counterpartyKind' | 'counterpartyName'>) {
  if (transaction.counterpartyKind !== 'person') return transaction.description;
  const name = transaction.counterpartyName ?? transaction.description;
  // Let ordinary multi-word names wrap intact. Only compact unusually long names;
  // preserve the first name and complete surname, never cut characters from either.
  if (Array.from(name).length <= 44) return transaction.description;
  return transaction.description.replace(name, compactPersonName(name));
}
