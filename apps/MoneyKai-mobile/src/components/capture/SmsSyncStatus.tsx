import React,{useEffect,useState} from 'react';
import {Switch,View} from 'react-native';
import {AppText as Text} from '@/components/ui/AppText';
import {Button} from '@/components/ui/Button';
import {useTheme} from '@/hooks/useTheme';
import {useAuthStore} from '@/stores/useAuthStore';
import {useLocalLedgerStore} from '@/stores/useLocalLedgerStore';
import {LARGE_SMS_LOCAL_ENABLED,APPROVED_SMS_CLOUD_ENABLED} from '@/config/largeSmsFeatures';
import {readSmsCloudConsent,setSmsCloudConsent,syncApprovedSmsOnce,type SmsSyncStatus as Status} from '@/services/approvedSmsSync';
import {ledgerRequest} from '@/services/localLedger';
import {Spacing} from '@/constants/theme';

type Job={id:string;state:string;pauseReason?:string;progress?:{scanned:number;parsed:number;duplicates:number;review:number}};
export function SmsSyncStatus(){
  const {colors}=useTheme(),owner=useAuthStore(s=>s.user?.id),ready=useLocalLedgerStore(s=>s.ready);
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState<Status>(),[job,setJob]=useState<Job>(),[notice,setNotice]=useState('');
  const pending=useLocalLedgerStore(s=>s.counts.pending);
  useEffect(()=>{
    setEnabled(false);setStatus(undefined);setJob(undefined);setNotice('');
    if(!owner || !ready || !(LARGE_SMS_LOCAL_ENABLED || APPROVED_SMS_CLOUD_ENABLED))return;let active=true;
    const refresh=async()=>{try{
      const [consent,stats,latest]=await Promise.all([readSmsCloudConsent(owner),ledgerRequest<Status>(owner,{op:'cloud',action:'stats'}),ledgerRequest<{job?:Job}>(owner,{op:'import',action:'latest'})]);
      if(active){setEnabled(consent.enabled);setStatus(stats);setJob(latest.job);}
    }catch{if(active)setNotice('Saved history is preserved. Progress is currently unavailable.');}};
    void refresh();const interval=setInterval(()=>void refresh(),5000);return()=>{active=false;clearInterval(interval);};
  },[owner,ready]);
  if(!(LARGE_SMS_LOCAL_ENABLED || APPROVED_SMS_CLOUD_ENABLED))return null;
  const toggle=async(value:boolean)=>{
    if(!owner || busy)return;setBusy(true);
    try{const consent=await setSmsCloudConsent(owner,value);setEnabled(consent.enabled);setNotice(consent.remotePending?'Your choice is saved on this phone. Cloud confirmation is pending.':value?'Approved SMS transactions will sync gradually.':'Future uploads are stopped. Previously synced transactions remain online.');}
    catch{setNotice('Could not change synchronization. Try again.');}finally{setBusy(false);}
  };
  const control=async(action:'pause'|'resume'|'cancel')=>{
    if(!owner || !job || busy)return;setBusy(true);
    try{setJob(await ledgerRequest<Job>(owner,{op:'import',action,id:job.id}));}catch{setNotice('The import could not change state. Committed results remain saved.');}finally{setBusy(false);}
  };
  return <View style={{gap:Spacing.md,paddingVertical:Spacing.lg}}>
    <Text accessibilityRole="header" style={{color:colors.textPrimary}}>Import and synchronization</Text>
    <Text style={{color:colors.textSecondary}}>Scanned {job?.progress?.scanned ?? 0} · Parsed {job?.progress?.parsed ?? 0} · Confirmed duplicates {job?.progress?.duplicates ?? 0}</Text>
    <Text style={{color:colors.textSecondary}}>Needs review {pending} · Awaiting sync {status?.awaitingSync ?? 0} · Synced {status?.synced ?? 0}</Text>
    {status?.conflicts?<Text style={{color:colors.textSecondary}}>{status.conflicts} conflicting edits retained for review.</Text>:null}
    {status?.pendingDeletions?<Text style={{color:colors.textSecondary}}>{status.pendingDeletions} cloud deletions pending.</Text>:null}
    {job?.pauseReason?<Text style={{color:colors.textSecondary}}>Import paused: {job.pauseReason.replaceAll('_',' ')}.</Text>:null}
    {job && !['completed','cancelled'].includes(job.state)?<View style={{gap:Spacing.sm}}>
      <Button title={job.state==='paused' || job.state==='failed'?'Resume import':'Pause import'} disabled={busy} variant="outline" onPress={()=>void control(job.state==='paused' || job.state==='failed'?'resume':'pause')}/>
      <Button title="Cancel remaining import" disabled={busy} variant="ghost" onPress={()=>void control('cancel')}/>
    </View>:null}
    <Text style={{color:colors.textPrimary}}>Sync approved SMS transactions</Text>
    <Text style={{color:colors.textSecondary}}>Upload only approved transaction details. Messages and pending drafts stay on your phone. Turning this off stops future uploads and keeps previously synced history online.</Text>
    <Switch accessibilityLabel="Sync approved SMS transactions" value={enabled} disabled={busy || (!APPROVED_SMS_CLOUD_ENABLED && !enabled)} onValueChange={value=>void toggle(value)}/>
    {!APPROVED_SMS_CLOUD_ENABLED?<Text style={{color:colors.textSecondary}}>Cloud synchronization is currently unavailable. Local parsing and review continue.</Text>:null}
    {enabled?<Button title="Check synchronization" variant="outline" disabled={busy} onPress={()=>{if(owner)void syncApprovedSmsOnce(owner).then(setStatus);}}/>:null}
    {status?.paused?<Text style={{color:colors.textSecondary}}>Synchronization paused: {status.paused.replaceAll('_',' ')}{status.retryAt?`. Retry after ${new Date(status.retryAt).toLocaleString()}`:''}.</Text>:null}
    {notice?<Text accessibilityLiveRegion="polite" style={{color:colors.textSecondary}}>{notice}</Text>:null}
  </View>;
}
