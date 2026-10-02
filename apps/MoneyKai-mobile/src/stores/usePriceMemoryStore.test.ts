import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/services/privateDeviceStorage', () => ({ privateDeviceStorage: { getItem: vi.fn(async () => null), setItem: vi.fn(), removeItem: vi.fn() } }));
import { usePriceMemoryStore } from './usePriceMemoryStore';

const entry = { ownerId: 'a', name: 'Milk', variant: 'Brand A', pricePaise: 6000, quantity: 500, unit: 'ml' as const, merchant: 'Shop', purchasedOn: '2026-09-30', transactionId: 'existing-expense' };
describe('account-isolated local price history', () => {
  beforeEach(() => usePriceMemoryStore.setState({ entries: [] }));
  it('stores prices without creating or modifying a financial transaction', () => {
    usePriceMemoryStore.getState().addEntry(entry);
    expect(usePriceMemoryStore.getState().entries[0]).toMatchObject(entry);
    expect(usePriceMemoryStore.getState().entries[0].id).toMatch(/^price_/);
  });
  it('refuses deletion by a different account', () => {
    usePriceMemoryStore.getState().addEntry(entry);
    const id = usePriceMemoryStore.getState().entries[0].id;
    usePriceMemoryStore.getState().removeEntry(id, 'b');
    expect(usePriceMemoryStore.getState().entries).toHaveLength(1);
    usePriceMemoryStore.getState().removeEntry(id, 'a');
    expect(usePriceMemoryStore.getState().entries).toHaveLength(0);
  });
  it('clears only the deleted owner’s prices', () => {
    usePriceMemoryStore.getState().addEntry(entry);
    usePriceMemoryStore.getState().addEntry({ ...entry, ownerId: 'b' });
    usePriceMemoryStore.getState().clearOwner('a');
    expect(usePriceMemoryStore.getState().entries.map(e => e.ownerId)).toEqual(['b']);
  });
});
