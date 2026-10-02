import { privateDeviceStorage } from '@/services/privateDeviceStorage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PriceUnit } from '@/utils/purchaseTools';

export interface PriceEntry {
  id: string;
  ownerId: string;
  name: string;
  variant: string;
  pricePaise: number;
  quantity: number;
  unit: PriceUnit;
  merchant: string;
  purchasedOn: string;
  transactionId?: string;
  createdAt: string;
}

interface PriceMemoryState {
  entries: PriceEntry[];
  addEntry: (entry: Omit<PriceEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string, ownerId: string) => void;
  clearOwner: (ownerId: string) => void;
}

// Item history stays on-device and is deliberately absent from cloud/backup contracts.
export const usePriceMemoryStore = create<PriceMemoryState>()(persist((set) => ({
  entries: [],
  addEntry: (entry) => set((state) => ({ entries: [{ ...entry,
    id: `price_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  }, ...state.entries] })),
  removeEntry: (id, ownerId) => set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id || entry.ownerId !== ownerId) })),
  clearOwner: (ownerId) => set((state) => ({ entries: state.entries.filter((entry) => entry.ownerId !== ownerId) })),
}), { name: 'moneykai-price-memory', storage: createJSONStorage(() => privateDeviceStorage) }));
