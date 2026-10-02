import type { ContactAllocation } from '@/types/transaction';

export type SelectedPerson = Pick<ContactAllocation, 'contactId' | 'name'>;
export type SplitMode = 'equal' | 'custom';

export type AllocationResult =
  | { allocations: ContactAllocation[]; error: null }
  | { allocations: null; error: string };

const centsFromInput = (value: string): number | null => {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
};

export function allocateContacts(
  amountInput: string,
  people: SelectedPerson[],
  mode: SplitMode,
  customAmounts: Record<string, string>,
): AllocationResult {
  if (people.length === 0) return { allocations: [], error: null };
  const totalCents = centsFromInput(amountInput);
  if (totalCents === null || totalCents <= 0) {
    return { allocations: null, error: 'Enter a valid amount with up to two decimal places.' };
  }
  if (totalCents < people.length) {
    return { allocations: null, error: 'The total must allow at least ₹0.01 for each person.' };
  }

  let cents: number[];
  if (mode === 'equal' || people.length === 1) {
    const base = Math.floor(totalCents / people.length);
    const remainder = totalCents % people.length;
    cents = people.map((_, index) => base + (index < remainder ? 1 : 0));
  } else {
    cents = people.map((person) => centsFromInput(customAmounts[person.contactId] ?? '') ?? -1);
    if (cents.some((value) => value <= 0)) {
      return { allocations: null, error: 'Enter a positive amount for every person.' };
    }
    if (cents.reduce((sum, value) => sum + value, 0) !== totalCents) {
      return { allocations: null, error: 'People amounts must add up to the transaction total.' };
    }
  }

  return {
    allocations: people.map((person, index) => ({
      contactId: person.contactId,
      name: person.name,
      amount: cents[index] / 100,
    })),
    error: null,
  };
}

export function summarizePeople(people: SelectedPerson[]): string {
  if (people.length === 0) return 'People';
  if (people.length === 1) return people[0].name;
  if (people.length === 2) return `${people[0].name}, ${people[1].name}`;
  return `${people[0].name}, ${people[1].name} +${people.length - 2}`;
}
