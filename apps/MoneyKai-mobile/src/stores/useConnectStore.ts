import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { privateDeviceStorage } from '@/services/privateDeviceStorage';
import type { PaymentConnectionId } from '@/constants/paymentConnections';

type Selection = Partial<Record<PaymentConnectionId, boolean>>;
interface ConnectState {
  notificationAppsByUser: Record<string, Selection>;
  setNotificationApp: (userId: string, app: PaymentConnectionId, enabled: boolean) => void;
}

export const useConnectStore = create<ConnectState>()(persist((set) => ({
  notificationAppsByUser: {},
  setNotificationApp: (userId, app, enabled) => set((state) => ({
    notificationAppsByUser: {
      ...state.notificationAppsByUser,
      [userId]: { ...state.notificationAppsByUser[userId], [app]: enabled },
    },
  })),
}), {
  name: 'moneykai-connect', storage: createJSONStorage(() => privateDeviceStorage),
  partialize: (state) => ({ notificationAppsByUser: state.notificationAppsByUser }),
}));
