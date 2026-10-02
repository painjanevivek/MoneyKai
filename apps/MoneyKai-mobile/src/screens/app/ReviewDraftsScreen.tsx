import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { LARGE_SMS_LOCAL_ENABLED } from '@/config/largeSmsFeatures';
import { LedgerDraftReviewScreen } from '@/components/capture/LedgerDraftReviewScreen';
import { Alert, FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { DraftReviewCard } from '@/components/capture/DraftReviewCard';
import { DraftReviewSheet } from '@/components/capture/DraftReviewSheet';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { draftConfirmationError, filterReviewDrafts, type DraftReviewSource, type DraftReviewTab } from '@/utils/draftReview';

const SOURCES = [{ id: 'all', label: 'All sources' }, { id: 'sms', label: 'SMS' }, { id: 'notification', label: 'Notifications' }, { id: 'aa', label: 'Accounts' }] as const;

export function ReviewDraftsScreen() {
  return LARGE_SMS_LOCAL_ENABLED ? <LedgerDraftReviewScreen/> : <LegacyReviewDraftsScreen/>;
}
function LegacyReviewDraftsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const owner = useAuthStore((state) => state.user?.id);
  const drafts = useCaptureStore((state) => state.drafts);
  const budget = useBudgetStore((state) => state.settings.monthly_allowance);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const [ready, setReady] = useState(useCaptureStore.persist.hasHydrated());
  const [storageIssue, setStorageIssue] = useState(false);
  const [tab, setTab] = useState<DraftReviewTab>('pending');
  const [source, setSource] = useState<DraftReviewSource>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState('');
  const [allowingAll, setAllowingAll] = useState(false);

  useEffect(() => {
    const unsubscribe = useCaptureStore.persist.onFinishHydration(() => { setReady(true); setStorageIssue(false); });
    if (useCaptureStore.persist.hasHydrated()) setReady(true);
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setStorageIssue(true), 10000);
    return () => clearTimeout(timeout);
  }, [ready]);
  useEffect(() => { setSelectedId(null); setCategories({}); setNotice(''); setError(undefined); }, [owner]);

  const ownDrafts = useMemo(() => owner ? drafts.filter((draft) => draft.user_id === owner) : [], [drafts, owner]);
  const pendingCount = ownDrafts.filter((draft) => draft.status === 'pending').length;
  const reviewedCount = ownDrafts.length - pendingCount;
  const filtered = useMemo(() => filterReviewDrafts(drafts, owner, tab, source, deferredQuery), [drafts, owner, tab, source, deferredQuery]);
  const selected = ownDrafts.find((draft) => draft.id === selectedId);
  const narrowed = Boolean(query.trim()) || source !== 'all';
  const resetFilters = () => { setQuery(''); setSource('all'); };
  const emptyAction = () => {
    if (!ready) {
      setStorageIssue(false);
      void Promise.resolve(useCaptureStore.persist.rehydrate()).then(() => {
        const hydrated = useCaptureStore.persist.hasHydrated();
        setReady(hydrated); setStorageIssue(!hydrated);
      }).catch(() => setStorageIssue(true));
    } else if (narrowed) resetFilters();
    else if (tab === 'pending') navigation.navigate('SmsParser');
    else setTab('pending');
  };

  const confirm = () => {
    const latest = useCaptureStore.getState().drafts.find((draft) => draft.id === selectedId);
    if (!latest) { setError('This draft is no longer available.'); return; }
    const category = categories[latest.id] ?? latest.category;
    const failure = draftConfirmationError(latest, useAuthStore.getState().user?.id, category, useBudgetStore.getState().settings.monthly_allowance);
    if (failure) { setError(failure); return; }
    try {
      if (!useCaptureStore.getState().confirmDraft(latest.id, category!)) { setError('Could not confirm this draft. Check your budget or an existing matching transaction. Nothing was added from this attempt.'); return; }
    } catch {
      setError('Could not complete confirmation. Check Transactions before trying again.'); return;
    }
    setSelectedId(null); setError(undefined); setNotice('Transaction confirmed. Find it in Transactions.');
  };
  const allowAll = () => {
    if (!ready || allowingAll || !owner || owner !== useAuthStore.getState().user?.id) return;
    if (!Number.isFinite(useBudgetStore.getState().settings.monthly_allowance) || useBudgetStore.getState().settings.monthly_allowance <= 0) {
      Alert.alert('Set a monthly budget', 'Your drafts will stay pending until you set a budget.', [
        { text: 'Cancel', style: 'cancel' }, { text: 'Set budget', onPress: () => navigation.navigate('Budget') },
      ]);
      return;
    }
    const ids = useCaptureStore.getState().drafts.filter((draft) => draft.user_id === owner && draft.status === 'pending').map((draft) => draft.id);
    if (!ids.length) return;
    setAllowingAll(true);
    Alert.alert(`Allow all ${ids.length} pending drafts?`, 'Add all pending drafts to Transactions, including those hidden by filters. Existing or suggested categories will be used; unknowns become Miscellaneous or Other Income. Invalid or duplicate-blocked drafts stay pending. Confirm only if their amounts, dates and directions are correct.', [
      { text: 'Cancel', style: 'cancel', onPress: () => setAllowingAll(false) },
      { text: 'Allow All', onPress: () => {
        try {
          if (useAuthStore.getState().user?.id !== owner) return;
          const result = useCaptureStore.getState().confirmAllDrafts(owner, ids, categories);
          setSelectedId(null); setTab('pending'); resetFilters();
          setNotice(`${result.added} ${result.added === 1 ? 'transaction added' : 'transactions added'}. ${result.pending ? `${result.pending} still pending—check invalid details or matching transactions. ` : ''}${result.interrupted ? 'Approval stopped. Check Transactions before trying again.' : 'Find added drafts in Transactions and Reviewed.'}`);
        } catch {
          setNotice('Approval stopped. Check Transactions before trying again.');
        } finally { setAllowingAll(false); }
      } },
    ], { cancelable: true, onDismiss: () => setAllowingAll(false) });
  };
  const ignore = () => {
    if (!selected || selected.status !== 'pending') return;
    const id = selected.id;
    Alert.alert('Ignore this draft?', 'It will move to Reviewed without adding a transaction.', [
      { text: 'Keep draft', style: 'cancel' },
      { text: 'Ignore draft', onPress: () => {
        const latest = useCaptureStore.getState().drafts.find((draft) => draft.id === id);
        if (!latest || latest.status !== 'pending' || latest.user_id !== useAuthStore.getState().user?.id) return;
        useCaptureStore.getState().ignoreDraft(id); setSelectedId(null); setNotice('Draft ignored. No transaction was added.');
      } },
    ]);
  };

  return <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
    <FlatList data={ready ? filtered : []} keyExtractor={(draft) => draft.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} initialNumToRender={8} ListHeaderComponent={<>
      <CenteredPageHeader title="Review drafts" leftAction={<ScreenBackButton compact />} rightAction={<PressableScale accessibilityRole="button" accessibilityLabel="Capture settings and bank accounts" onPress={() => navigation.navigate('AutoCapture')} style={styles.iconButton}><AppIcon name="cog-outline" size={22} color={colors.textPrimary} /></PressableScale>} />
      <View style={styles.intro}>
        <Text style={[styles.count, { color: colors.textPrimary }]}>{ready ? pendingCount : '—'}</Text>
        <View style={styles.introCopy}><Text style={[styles.heading, { color: colors.textPrimary }]}>{pendingCount === 1 ? 'draft needs your review' : 'drafts need your review'}</Text></View>
        <PressableScale accessibilityRole="button" accessibilityLabel="Allow all pending drafts" accessibilityState={{ busy: allowingAll, disabled: !ready || !owner || !pendingCount || allowingAll }} disabled={!ready || !owner || !pendingCount || allowingAll} onPress={allowAll} style={[styles.allButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.tabText, { color: colors.textPrimary }]}>Allow All</Text></PressableScale>
      </View>
      <View style={[styles.privacy, { borderBottomColor: colors.borderLight }]}><AppIcon name="lock-outline" size={15} color={colors.textSecondary} /><Text style={[styles.body, { color: colors.textSecondary }]}>SMS drafts stay encrypted on this phone.</Text></View>
      <View style={[styles.tabs, { backgroundColor: colors.surfaceElevated }]}>{(['pending', 'reviewed'] as const).map((item) => {
        const active = item === tab;
        return <PressableScale key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`${item === 'pending' ? 'Pending' : 'Reviewed'}, ${item === 'pending' ? pendingCount : reviewedCount} drafts`} onPress={() => setTab(item)} style={[styles.tab, { backgroundColor: active ? colors.primary : 'transparent' }]}><Text style={[styles.tabText, { color: active ? colors.textInverse : colors.textSecondary }]}>{item === 'pending' ? 'Pending' : 'Reviewed'} · {item === 'pending' ? pendingCount : reviewedCount}</Text></PressableScale>;
      })}</View>
      {ready && ownDrafts.length > 0 ? <>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon name="magnify" size={19} color={colors.textSecondary} />
        <TextInput accessibilityLabel="Search drafts" placeholder="Search merchant, amount or account" placeholderTextColor={colors.textTertiary} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={[styles.searchInput, { color: colors.textPrimary }]} />
        {query ? <PressableScale accessibilityRole="button" accessibilityLabel="Clear draft search" onPress={() => setQuery('')} style={styles.iconButton}><AppIcon name="close" size={18} color={colors.textSecondary} /></PressableScale> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{SOURCES.filter((item) => item.id !== 'aa' || ownDrafts.some((draft) => draft.captureSource === 'aa')).map((item) => <PressableScale key={item.id} accessibilityRole="radio" accessibilityState={{ checked: source === item.id }} onPress={() => setSource(item.id)} style={[styles.filter, { borderColor: source === item.id ? colors.textPrimary : colors.borderLight, backgroundColor: colors.surface }]}><Text style={[styles.body, { color: source === item.id ? colors.textPrimary : colors.textSecondary }]}>{item.label}</Text></PressableScale>)}</ScrollView>
      </> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.textPrimary }]}>{notice}</Text> : null}
    </>} renderItem={({ item }) => <DraftReviewCard draft={item} currencySymbol={currencySymbol} onOpen={(draft) => { setError(undefined); setSelectedId(draft.id); }} />} ListEmptyComponent={<ScreenState title={storageIssue ? 'Could not open drafts' : !ready ? 'Opening drafts' : narrowed ? 'No matching drafts' : tab === 'pending' ? 'All caught up' : tab === 'all' ? 'No drafts yet' : 'No reviewed drafts yet'} body={storageIssue ? 'The encrypted queue is unavailable or taking longer to open. Retry without deleting any stored drafts.' : !ready ? 'Reading the encrypted review queue on this phone.' : narrowed ? 'Try another search or show all sources.' : tab === 'pending' ? 'New captured drafts will appear here. Nothing is added from this queue without your confirmation.' : tab === 'all' ? 'Captured and reviewed drafts will appear here.' : 'Confirmed and ignored drafts appear here after you review them.'} loading={!ready && !storageIssue} tone={storageIssue ? 'danger' : 'neutral'} icon={tab === 'pending' ? 'check-circle-outline' : 'file-document-outline'} actionLabel={storageIssue ? 'Retry' : ready ? narrowed ? 'Reset filters' : tab === 'pending' ? 'Open SMS parser' : 'View pending' : undefined} onAction={emptyAction} style={styles.empty} />} />
    {selected ? <DraftReviewSheet key={selected.id} draft={selected} category={categories[selected.id] ?? selected.category} currencySymbol={currencySymbol} hasBudget={Number.isFinite(budget) && budget > 0} error={error} onCategoryChange={(category) => { setCategories((current) => ({ ...current, [selected.id]: category })); setError(undefined); }} onConfirm={confirm} onIgnore={ignore} onClose={() => setSelectedId(null)} onBudget={() => { setSelectedId(null); navigation.navigate('Budget'); }} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  intro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing.md },
  count: { fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['5xl'], fontVariant: ['tabular-nums'] },
  introCopy: { flex: 1, minWidth: 0, gap: Spacing.xs },
  allButton: { minHeight: 44, minWidth: 52, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.sm, borderWidth: 1 },
  heading: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md },
  body: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm },
  privacy: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.lg },
  tabs: { flexDirection: 'row', borderRadius: BorderRadius.md, padding: Spacing.xs, marginBottom: Spacing.lg },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: BorderRadius.sm },
  tabText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, fontVariant: ['tabular-nums'] },
  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.md, paddingLeft: Spacing.md, paddingRight: Spacing.xs, minHeight: 48 },
  searchInput: { flex: 1, minWidth: 0, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, minHeight: 48 },
  filters: { gap: Spacing.sm, paddingVertical: Spacing.md },
  filter: { borderWidth: 1, borderRadius: BorderRadius.full, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  notice: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginBottom: Spacing.md },
  empty: { marginTop: Spacing.md },
});
