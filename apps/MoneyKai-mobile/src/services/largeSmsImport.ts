import { ledgerRequest, initializeLedger } from './localLedger';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import { getSmsImportRangeOption } from '@/constants/smsImportRanges';
import type { MonitoredAccount } from '@/types/capture';
import type { SmsImportProgress, SmsImportRangeId } from '@/types/smsImport';
import type { SmsInboxImportSummary } from './autoCaptureService';
export type LocalImportJob = {
  id: string; owner: string; state: 'discovering' | 'awaiting_account_approval' | 'importing' | 'completed' | 'paused' | 'cancelled' | 'failed';
  parserVersion: string; fromDate: number; boundaryDate: number; boundaryId: number; cursorDate: number; cursorId: number;
  selectedAccounts: string[]; progress: { scanned: number; parsed: number; duplicates: number; review: number; awaitingSync: number; synced: number }; ignored: number; batches: number; pauseReason?: string;
};
export const localImportAction = (owner: string, action: string, details: Record<string,unknown> = {}) => ledgerRequest<LocalImportJob>(owner,{ op:'import',action,...details });
const running = new Set<string>();
export async function runLargeSmsImport(owner: string, rangeId: SmsImportRangeId, onProgress: ((progress: SmsImportProgress) => void) | undefined, canContinue: () => boolean): Promise<SmsInboxImportSummary> {
  if(running.has(owner)) throw new Error('An SMS import is already running');
  running.add(owner);
  try {
    await initializeLedger(owner);
    await ledgerRequest(owner,{op:'features',enabled:true});
    const range = getSmsImportRangeOption(rangeId);
    let job = await localImportAction(owner,'start',{fromDate:range.days ? Date.now()-range.days*86400000 : 0});
    if(job.state === 'paused' || job.state === 'failed') job = await localImportAction(owner,'resume',{id:job.id});
    if(job.state === 'awaiting_account_approval') {
      const accounts = useCaptureStore.getState().monitoredAccounts.filter(item => item.status === 'approved').map(item => item.id);
      if(accounts.length) job = await localImportAction(owner,'select',{id:job.id,accounts});
    }
    while(job.state === 'discovering' || job.state === 'importing') {
      if(!canContinue()) { job = await localImportAction(owner,'pause',{id:job.id}); break; }
      job = await localImportAction(owner,'tick',{id:job.id});
      if(canContinue()) onProgress?.({phase:job.state === 'discovering' ? 'discovering_accounts' : job.state === 'completed' ? 'complete' : 'importing_transactions',scannedCount:job.progress.scanned,eligibleCount:job.progress.parsed,draftedCount:job.progress.review,duplicateCount:job.progress.duplicates,parserIgnoredCount:job.ignored,pageCount:job.batches,message:job.pauseReason ?? `Import ${job.state.replaceAll('_',' ')}`});
      await new Promise<void>(resolve => setTimeout(resolve,0));
    }
    if(job.state === 'awaiting_account_approval') {
      // Account metadata is small and paginated. No SMS body crosses this bridge.
      let cursor: string | undefined;
      do {
        const page = await ledgerRequest<{items: MonitoredAccount[]; nextCursor: string | null}>(owner,{op:'import',action:'accounts',id:job.id,cursor});
        if(!canContinue()) break;
        useCaptureStore.setState(state => ({monitoredAccounts:[...state.monitoredAccounts,...page.items.filter(account => !state.monitoredAccounts.some(existing => existing.id === account.id))]}));
        cursor = page.nextCursor ?? undefined;
      } while(cursor);
    }
    if(canContinue()) await useLocalLedgerStore.getState().initialize(owner);
    const selected = useCaptureStore.getState().monitoredAccounts;
    return { status:job.state === 'awaiting_account_approval' ? 'needs_account_approval' : job.state === 'completed' ? 'imported' : 'ignored',scannedCount:job.progress.scanned,nativeImportedCount:job.progress.parsed,nativeIgnoredCount:job.ignored,discoveredAccountCount:selected.length,pendingAccountApprovalCount:selected.filter(item=>item.status==='pending').length,approvedAccountCount:selected.filter(item=>item.status==='approved').length,declinedAccountCount:selected.filter(item=>item.status==='declined').length,draftedCount:job.progress.review,confirmedCount:job.progress.parsed-job.progress.duplicates-job.progress.review,duplicateCount:job.progress.duplicates,pendingReviewCount:job.progress.review,parserIgnoredCount:job.ignored,accountsSkippedCount:0,message:job.pauseReason ?? `Import ${job.state.replaceAll('_',' ')}. Committed records remain on this phone.` };
  } finally { running.delete(owner); }
}
