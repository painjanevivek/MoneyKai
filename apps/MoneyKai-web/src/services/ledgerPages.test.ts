import { beforeEach,expect,it,vi } from 'vitest';
const api=vi.hoisted(()=>({getLedgerTransactions:vi.fn()}));
vi.mock('./backendApi',()=>({backendApi:api}));
import { getLedgerPage,resetLedgerPages,ledgerCacheSize,invalidateLedgerPages } from './ledgerPages';
beforeEach(()=>{resetLedgerPages();vi.clearAllMocks();});
it('keeps at most ten result pages while continuing past the old history ceiling',async()=>{
  api.getLedgerTransactions.mockImplementation(async(_filters,cursor)=>({items:[{id:cursor || 'first'}],page:{nextCursor:'next',limit:50}}));
  for(let i=0;i<250;i++)await getLedgerPage('alice',{},String(i));
  expect(ledgerCacheSize()).toBe(10);
  expect(api.getLedgerTransactions).toHaveBeenCalledTimes(250);
  await getLedgerPage('alice',{},'249');expect(api.getLedgerTransactions).toHaveBeenCalledTimes(250);
  invalidateLedgerPages();expect(ledgerCacheSize()).toBe(0);
});
it('rejects an old response after an owner change',async()=>{
  let resolve!:(value:unknown)=>void;
  api.getLedgerTransactions.mockReturnValue(new Promise(r=>{resolve=r;}));
  const pending=getLedgerPage('alice',{});
  resetLedgerPages('bob');resolve({items:[{id:'alice'}],page:{nextCursor:null}});
  await expect(pending).rejects.toThrow('session changed');
  expect(ledgerCacheSize()).toBe(0);
});
