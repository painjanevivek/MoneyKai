import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { privateDeviceStorage } from '@/services/privateDeviceStorage';
import { counterpartyAliasKey, normalizedPhone, phoneDigits, type LocalPhone } from '@/utils/transactionPreferences';
import type { Transaction } from '@/types/transaction';
import { useAuthStore } from './useAuthStore';

type Preferences = {
  aliases: Record<string, Record<string, string>>;
  archived: Record<string, Record<string, boolean>>;
  phones: Record<string, LocalPhone>;
  setAlias: (transaction: Transaction, nickname: string) => boolean;
  setArchived: (transaction: Transaction, archived: boolean) => boolean;
  setPhone: (owner: string, countryCode: string, nationalNumber: string) => boolean;
  clearOwner: (owner: string) => void;
};

// Private preference map stays on-device. A saved transaction carries only its own nickname.
export const useTransactionPreferencesStore = create<Preferences>()(persist((set) => ({
  aliases: {}, archived: {}, phones: {},
  setAlias: (transaction, nickname) => {
    const owner = useAuthStore.getState().user?.id;
    const key = counterpartyAliasKey(transaction);
    const name = nickname.trim().replace(/\s+/g, ' ');
    if (!owner || owner !== transaction.user_id || !key || Array.from(name).length > 100) return false;
    set(state => {
      const aliases = { ...state.aliases[owner] };
      if (name) aliases[key] = name; else delete aliases[key];
      return { aliases: { ...state.aliases, [owner]: aliases } };
    });
    return true;
  },
  setArchived: (transaction, archived) => {
    const owner = useAuthStore.getState().user?.id;
    if (!owner || owner !== transaction.user_id) return false;
    set(state => ({ archived: { ...state.archived, [owner]: { ...state.archived[owner], [transaction.id]: archived } } }));
    return true;
  },
  setPhone: (owner, countryCode, nationalNumber) => {
    if (!owner || owner !== useAuthStore.getState().user?.id || !normalizedPhone(countryCode, nationalNumber)) return false;
    set(state => ({ phones: { ...state.phones, [owner]: { countryCode: `+${countryCode.replace(/^\+/, '')}`, nationalNumber: phoneDigits(nationalNumber) } } }));
    return true;
  },
  clearOwner: (owner) => {
    if (!owner || useAuthStore.getState().user?.id !== owner) return;
    set(state => {
      const aliases = { ...state.aliases }; const archived = { ...state.archived }; const phones = { ...state.phones };
      delete aliases[owner]; delete archived[owner]; delete phones[owner];
      return { aliases, archived, phones };
    });
  },
}), { name: 'moneykai-private-transaction-preferences', storage: createJSONStorage(() => privateDeviceStorage), partialize: state => ({ aliases: state.aliases, archived: state.archived, phones: state.phones }) }));
