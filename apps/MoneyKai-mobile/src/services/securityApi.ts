import { backendApi } from './backendApi';
import type { AuditEvent, DeleteFinancialDataResponse, SecurityHardeningStatus } from '@/types/security';

const DELETE_CONFIRMATION = 'DELETE_FINANCIAL_DATA' as const;

export const securityApi = {
  getHardeningStatus: async (): Promise<SecurityHardeningStatus> =>
    backendApi.getSecurityHardeningStatus(),

  listAuditEvents: async (): Promise<AuditEvent[]> => {
    const response = await backendApi.listAuditEvents();
    return response.items;
  },

  deleteFinancialData: async (): Promise<DeleteFinancialDataResponse> =>
    backendApi.deleteFinancialData({ confirm: DELETE_CONFIRMATION }),
};
