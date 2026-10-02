import React,{useEffect,useState} from 'react';
import {Alert,FlatList,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppText as Text} from '@/components/ui/AppText';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {CenteredPageHeader} from '@/components/ui/CenteredPageHeader';
import {ScreenBackButton} from '@/components/ui/ScreenBackButton';
import {ScreenState} from '@/components/ui/ScreenState';
import {DraftReviewCard} from './DraftReviewCard';
import {DraftReviewSheet} from './DraftReviewSheet';
import {useTheme} from '@/hooks/useTheme';
import {useLocalLedgerStore} from '@/stores/useLocalLedgerStore';
import {useAuthStore} from '@/stores/useAuthStore';
import {useBudgetStore} from '@/stores/useBudgetStore';
import {useSettingsStore} from '@/stores/useSettingsStore';
import {localLedger,type LedgerCursor} from '@/services/localLedger';
import type {DraftTransaction} from '@/types/capture';
import {Spacing} from '@/constants/theme';

export function LedgerDraftReviewScreen(){
  const {colors}=useTheme();const owner=useAuthStore(s=>s.user?.id);
  const rows=useLocalLedgerStore(s=>s.drafts),ready=useLocalLedgerStore(s=>s.ready),next=useLocalLedgerStore(s=>s.draftCursor),count=useLocalLedgerStore(s=>s.counts.pending);
  const currency=useSettingsStore(s=>s.currencySymbol),budget=useBudgetStore(s=>s.settings.monthly_allowance);
  const [query,setQuery]=useState(''),[cursor,setCursor]=useState<LedgerCursor>(),[previous,setPrevious]=useState<(LedgerCursor|undefined)[]>([]);
  const [selected,setSelected]=useState<DraftTransaction>(),[category,setCategory]=useState<string>(),[busy,setBusy]=useState(false),[error,setError]=useState<string>();
  useEffect(()=>{setCursor(undefined);setPrevious([]);setSelected(undefined);},[owner,query]);
  useEffect(()=>{
    if(!ready || !owner)return;let active=true;setBusy(true);
    const timer=setTimeout(()=>void useLocalLedgerStore.getState().queryDrafts({review:'pending',merchantPrefix:query.trim() || undefined,cursor}).catch(()=>{if(active)setError('Could not load drafts. Your saved records are preserved.');}).finally(()=>{if(active)setBusy(false);}),150);
    return()=>{active=false;clearTimeout(timer);};
  },[owner,ready,query,cursor]);
  const refresh=async()=>{await Promise.all([useLocalLedgerStore.getState().queryDrafts(),useLocalLedgerStore.getState().queryTransactions(),useLocalLedgerStore.getState().refreshOverview()]);};
  const confirm=async()=>{
    if(busy || !owner || !selected || !category || budget<=0)return;setBusy(true);setError(undefined);
    try{await localLedger.approve(owner,selected.id,category);setSelected(undefined);await refresh();}
    catch{setError('Could not confirm this draft. It remains saved for review.');}finally{setBusy(false);}
  };
  const ignore=()=>{
    if(!owner || !selected || busy)return;
    Alert.alert('Dismiss this draft?','The encrypted draft will remain as dismissed; no transaction will be added.',[
      {text:'Keep draft',style:'cancel'},{text:'Dismiss',onPress:async()=>{
        setBusy(true);try{await localLedger.putDraft(owner,{...selected,status:'ignored'});setSelected(undefined);await refresh();}
        catch{setError('Could not dismiss the draft. Try again.');}finally{setBusy(false);}
      }},
    ]);
  };
  return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}>
    <FlatList data={ready?rows:[]} keyExtractor={row=>row.id} initialNumToRender={8} maxToRenderPerBatch={8} contentContainerStyle={{padding:Spacing.lg,gap:Spacing.md}} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={{gap:Spacing.md}}>
        <CenteredPageHeader title="Review drafts" leftAction={<ScreenBackButton compact/>}/>
        <Text accessibilityRole="header" style={{color:colors.textPrimary}}>{count.toLocaleString('en-IN')} drafts awaiting review</Text>
        <Text style={{color:colors.textSecondary}}>Pending drafts stay encrypted on this phone until you review or dismiss them. Approved transactions appear in Activity.</Text>
        <Input label="Search merchant prefix" value={query} onChangeText={setQuery}/>
        {error?<Text accessibilityRole="alert" style={{color:colors.error}}>{error}</Text>:null}
      </View>}
      renderItem={({item})=><DraftReviewCard draft={item} currencySymbol={currency} onOpen={draft=>{setSelected(draft);setCategory(draft.category ?? draft.suggestedCategory);setError(undefined);}}/>}
      ListEmptyComponent={<ScreenState loading={!ready || busy} title={busy?'Loading drafts':'No pending drafts on this page'} body="Use Previous to return, or change the merchant search."/>}
      ListFooterComponent={<View style={{gap:Spacing.md}}>
        <Button title="Previous page" variant="outline" disabled={busy || !previous.length} onPress={()=>{setCursor(previous.at(-1));setPrevious(previous.slice(0,-1));}}/>
        <Button title="Next 50 drafts" disabled={busy || !next} onPress={()=>{setPrevious([...previous,cursor].slice(-10));setCursor(next!);}}/>
        <Button title="First page" variant="ghost" onPress={()=>{setCursor(undefined);setPrevious([]);}}/>
      </View>}/>
    {selected?<DraftReviewSheet draft={selected} currencySymbol={currency} category={category} error={error} hasBudget={budget>0 && !busy} onCategoryChange={setCategory} onConfirm={()=>void confirm()} onIgnore={ignore} onBudget={()=>setError('Set your monthly budget before confirming. Your draft remains saved.')} onClose={()=>setSelected(undefined)}/>:null}
  </SafeAreaView>;
}
