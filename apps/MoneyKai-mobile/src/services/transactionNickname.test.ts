import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({owner:'alice',update:vi.fn(),alias:vi.fn(),transactions:[{id:'one',user_id:'alice'}]}));
vi.mock('@/stores/useAuthStore',()=>({useAuthStore:{getState:()=>({user:{id:state.owner}})}}));
vi.mock('@/stores/useTransactionStore',()=>({useTransactionStore:{getState:()=>({updateTransactionDurable:state.update,transactions:state.transactions})}}));
vi.mock('@/stores/useTransactionPreferencesStore',()=>({useTransactionPreferencesStore:{getState:()=>({setAlias:state.alias})}}));
import {saveTransactionNickname} from './transactionNickname';
import type {Transaction} from '@/types/transaction';
const row={id:'one',user_id:'alice',description:'Original merchant'} as Transaction;
beforeEach(()=>{vi.clearAllMocks();state.owner='alice';state.transactions=[{id:'one',user_id:'alice'}];state.update.mockResolvedValue(undefined);state.alias.mockReturnValue(true);});
it('saves the nickname through the transaction synchronization action before changing the private alias',async()=>{
  await saveTransactionNickname(row,'  My   cafe  ');
  expect(state.update).toHaveBeenCalledWith('one',{nickname:'My cafe'});
  expect(state.alias).toHaveBeenCalledWith(row,'My cafe');
  expect(state.update.mock.invocationCallOrder[0]).toBeLessThan(state.alias.mock.invocationCallOrder[0]);
  expect(row.description).toBe('Original merchant');
});
it('clears the saved nickname explicitly and retains preferences if the financial write fails',async()=>{
  await saveTransactionNickname(row,'');expect(state.update).toHaveBeenCalledWith('one',{nickname:''});
  state.alias.mockClear();state.update.mockRejectedValue(new Error('disk full'));
  await expect(saveTransactionNickname(row,'New')).rejects.toThrow('disk full');expect(state.alias).not.toHaveBeenCalled();
});
it('stops nickname writes when ownership changes, including during an asynchronous save',async()=>{
  state.owner='bob';await expect(saveTransactionNickname(row,'New')).rejects.toThrow('owner');expect(state.update).not.toHaveBeenCalled();
  state.owner='alice';state.update.mockImplementation(async()=>{state.owner='bob';});
  await expect(saveTransactionNickname(row,'New')).rejects.toThrow('owner');expect(state.alias).not.toHaveBeenCalled();
});
it('does not recreate a transaction removed while its nickname editor was open',async()=>{
  state.transactions=[];await expect(saveTransactionNickname(row,'Ghost')).rejects.toThrow('unavailable');expect(state.update).not.toHaveBeenCalled();expect(state.alias).not.toHaveBeenCalled();
});
