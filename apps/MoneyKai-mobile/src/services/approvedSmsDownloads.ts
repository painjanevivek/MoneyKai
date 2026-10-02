import { APPROVED_SMS_CLOUD_ENABLED } from '@/config/largeSmsFeatures';
import { useAuthStore } from '@/stores/useAuthStore';
import { isCloudApprovedSmsTransaction } from '@moneykai/domain/transactionImports';
import type { Transaction } from '@/types/transaction';
import { ledgerRequest } from './localLedger';
import { approvedSmsRequest } from './approvedSmsSyncApi';
import { captureRemoteSyncSession, isRemoteSyncSessionCurrent } from '@moneykai/domain/syncSession';

type Event = { action:string; resource:string; itemId?:string; payload?:Transaction & {importManifest?:{ids?:string[];deletedIds?:string[]}} };
type ChangePage = {events:Event[];syncToken:string;nextSyncToken?:string|null;windowEnd?:string;page:{nextCursor?:string|null};resetRequired:boolean};
type DownloadState = {syncToken?:string;cursor?:string|null;windowEnd?:string|null;pending?:ChangePage;eventIndex?:number};
const current = (owner:string) => useAuthStore.getState().user?.id === owner;
const queue = <T>(owner:string,action:string,extra:Record<string,unknown>={}) => ledgerRequest<T>(owner,{op:'cloud',action,...extra});
/** At most one 20-manifest page per run and 50 transaction rows per bridge call. */
export async function downloadApprovedSmsOnce(owner:string):Promise<void> {
  if(!APPROVED_SMS_CLOUD_ENABLED || !current(owner)) return;
  const session=captureRemoteSyncSession(owner);
  const active=() => isRemoteSyncSessionCurrent(session,useAuthStore.getState().user?.id);
  let state = await queue<DownloadState>(owner,'downloadState');
  if(!state.pending) {
    const query = new URLSearchParams();
    if(state.syncToken) query.set('sync_token',state.syncToken);
    if(state.cursor) query.set('cursor',state.cursor);
    if(state.windowEnd) query.set('window_end',state.windowEnd);
    const page = await approvedSmsRequest<ChangePage>(owner,`/v1/capture/approved-transactions/changes?${query}`);
    if(!active()) return;
    if(page.resetRequired) {
      await queue(owner,'setDownloadState',{state:{}}); return;
    }
    state = {...state,syncToken:page.syncToken,pending:page,eventIndex:0};
    await queue(owner,'setDownloadState',{state});
  }
  const page = state.pending!;
  for(let index=state.eventIndex ?? 0; index<page.events.length; index++) {
    if(!active()) return;
    const event=page.events[index]; const manifest=event.payload?.importManifest;
    let rows:Transaction[]=[]; let deletedIds:string[]=[];
    if(event.resource === 'transactions') {
      if(manifest?.ids?.length) rows=(await approvedSmsRequest<{items:Transaction[]}>(owner,'/v1/capture/approved-transactions/read',manifest.ids)).items;
      if(manifest?.deletedIds) deletedIds=manifest.deletedIds;
      if(event.action === 'deleted' && event.itemId?.startsWith('sms_')) deletedIds=[event.itemId];
      if(!manifest && event.action === 'upserted' && event.payload && isCloudApprovedSmsTransaction(event.payload)) rows=[event.payload];
    }
    if(!active()) return;
    state={...state,eventIndex:index+1};
    await queue(owner,'mergePage',{rows:rows.filter(isCloudApprovedSmsTransaction),deletedIds,state});
  }
  await queue(owner,'setDownloadState',{state:{syncToken:page.nextSyncToken ?? page.syncToken,cursor:page.page.nextCursor ?? null,windowEnd:page.page.nextCursor ? page.windowEnd : null}});
}
