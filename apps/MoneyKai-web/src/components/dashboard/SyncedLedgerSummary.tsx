import React,{useEffect,useState} from 'react';
import { View,Text } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { backendApi,type MonthlyLedgerSummary } from '@/services/backendApi';
import { useLedgerInvalidation } from '@/services/ledgerPages';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spacing,Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { getCategoryById } from '@/constants/categories';

export function SyncedLedgerSummary({month}:{month:string}) {
  const owner=useAuthStore(s=>s.user?.id),revision=useLedgerInvalidation(s=>s.revision),{colors}=useTheme();
  const [summary,setSummary]=useState<MonthlyLedgerSummary>(),[error,setError]=useState<string>(),[busy,setBusy]=useState(false);
  useEffect(()=>{
    setSummary(undefined);setError(undefined);let current=true;
    if(owner) void backendApi.getMonthlyLedgerSummary(month).then(s=>{if(current && owner===useAuthStore.getState().user?.id)setSummary(s);})
      .catch(()=>{if(current)setError('Synced totals are unavailable. Try again later.');});
    return ()=>{current=false;};
  },[owner,month,revision]);
  const step=async()=>{
    if(!owner)return;setBusy(true);setError(undefined);
    try {
      const job=await backendApi.reconcileLedgerSummary();
      if(owner!==useAuthStore.getState().user?.id)return;
      if(job.phase==='completed')setSummary(await backendApi.getMonthlyLedgerSummary(month));
      else setError(`Rebuilding synced totals: ${job.processed} records checked. Continue when ready.`);
    } catch {setError('Summary rebuilding is paused. It resumes when the free cloud allowance is available.');}
    finally{setBusy(false);}
  };
  const active=summary?.status==='active';
  const amount=(direction:string)=>(summary?.items.filter(s=>s.category==='' && s.direction===direction).reduce((n,s)=>n+s.amountMinor,0) || 0)/100;
  return <Card style={{gap:Spacing.md}}>
    <Text style={{color:colors.textPrimary,fontFamily:Typography.fontFamily.display,fontSize:Typography.fontSize.xl}}>Synced totals · {month}</Text>
    <Text style={{color:colors.textSecondary}}>Phone totals include the complete local ledger. This website includes records synchronized so far; uploads continue gradually.</Text>
    {error?<Text accessibilityRole="alert" style={{color:colors.warning}}>{error}</Text>:null}
    {!summary && !error?<Text accessibilityLiveRegion="polite" style={{color:colors.textSecondary}}>Loading synced totals…</Text>:null}
    {active?<>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:Spacing.lg}}>
        {['expense','income'].map(d=><View key={d}><Text style={{color:colors.textSecondary}}>{d==='expense'?'Spent':'Income'}</Text><Text style={{color:colors.textPrimary,fontSize:Typography.fontSize.xl}}>{formatCurrency(amount(d))}</Text></View>)}
      </View>
      {summary.items.filter(s=>s.category && s.direction==='expense' && s.count>0).map(s=><View key={s.category} style={{flexDirection:'row',justifyContent:'space-between',gap:Spacing.sm}}>
        <Text style={{color:colors.textSecondary,flex:1}}>{getCategoryById(s.category)?.name || s.category} · {s.count} records</Text>
        <Text style={{color:colors.textPrimary}}>{formatCurrency(s.amountMinor/100)}</Text>
      </View>)}
    </>:summary?<><Text style={{color:colors.textSecondary}}>Existing history needs a summary rebuild before monthly totals can be shown.</Text><Button title={busy?'Checking…':'Continue summary rebuild'} disabled={busy} onPress={()=>void step()} variant="outline"/></>:null}
  </Card>;
}
