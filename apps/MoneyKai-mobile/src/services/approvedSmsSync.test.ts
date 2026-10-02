import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateRemoteSyncSession } from '@moneykai/domain/syncSession';
const state=vi.hoisted(()=>({owner:'alice',enabled:true, revision:1, calls:[] as string[], batch:{id:'batch',kind:'upload',jobId:'phone_1',payload:{consentRevision:1,idempotencyKey:'batch',transactions:[]}}}));
const request=vi.hoisted(()=>vi.fn());
vi.mock('@/config/largeSmsFeatures',()=>({APPROVED_SMS_CLOUD_ENABLED:true}));
vi.mock('@/stores/useAuthStore',()=>({useAuthStore:{getState:()=>({user:{id:state.owner}})}}));
vi.mock('./approvedSmsSyncApi',()=>({approvedSmsRequest:request,SmsCloudPause:class extends Error {status=503;availability=undefined;}}));
vi.mock('./localLedger',()=>({ledgerRequest:vi.fn(async (_owner:string,query:{action:string;consent?:{enabled:boolean;revision:number}})=>{
  state.calls.push(query.action);
  if(query.action==='consent') return {enabled:state.enabled,revision:state.revision,version:'sms-approved-sync-v1'};
  if(query.action==='claim') return state.batch;
  if(query.action==='setConsent' && query.consent) { state.enabled=query.consent.enabled; state.revision=query.consent.revision; }
  return {};
})}));
import { syncApprovedSmsOnce } from './approvedSmsSync';
describe('durable approved upload orchestration',()=>{
  beforeEach(()=>{state.owner='alice';state.enabled=true;state.revision=1;state.calls=[];request.mockReset();request.mockResolvedValue({id:'batch',jobId:'phone_1'});});
  it('sends one frozen batch at a time and acknowledges only its response',async()=>{
    let finish!:()=>void; request.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
    const first=syncApprovedSmsOnce('alice'); const second=syncApprovedSmsOnce('alice');
    await vi.waitFor(()=>expect(request).toHaveBeenCalledTimes(1)); finish(); await Promise.all([first,second]);
    expect(state.calls.filter(action=>action==='claim')).toHaveLength(1); expect(state.calls.filter(action=>action==='ack')).toHaveLength(1);
  });
  it('rechecks revocation between job creation and batch submission',async()=>{
    request.mockImplementationOnce(async()=>{state.enabled=false;state.revision=2;return {};});
    expect((await syncApprovedSmsOnce('alice')).paused).toBe('consent_changed');
    expect(request).toHaveBeenCalledTimes(1); expect(state.calls).not.toContain('ack');
  });
  it('retains the same batch after a lost response',async()=>{
    request.mockResolvedValueOnce({}); request.mockRejectedValueOnce(new Error('response lost'));
    await syncApprovedSmsOnce('alice'); expect(state.calls).toContain('defer'); expect(state.calls).not.toContain('ack');
    await syncApprovedSmsOnce('alice');
    expect(request.mock.calls.filter(call=>String(call[1]).endsWith('/batches')).map(call=>(call[2] as {idempotencyKey:string}).idempotencyKey)).toEqual(['batch','batch']);
  });
  it('rejects stale results after sign-out and sign-in to the same owner',async()=>{
    let finish!:(value:unknown)=>void; request.mockResolvedValueOnce({});request.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    const pending=syncApprovedSmsOnce('alice'); await vi.waitFor(()=>expect(request).toHaveBeenCalledTimes(2));
    invalidateRemoteSyncSession(); finish({id:'batch',jobId:'phone_1'}); await pending;
    expect(state.calls).not.toContain('ack');
  });
});
