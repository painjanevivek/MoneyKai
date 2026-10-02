import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { TransactionCalendar } from '@/components/ui/TransactionCalendar';
import { PeopleAllocationField } from '@/components/ui/PeopleAllocationField';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useHomeModeStore } from '@/stores/useHomeModeStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTheme } from '@/hooks/useTheme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { BorderRadius, Spacing, TransactionDirectionColorOnDark, Typography } from '@/constants/theme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import { fromLocalDateKey, isAllowedTransactionDate } from '@/utils/calendarDates';
import { allocateContacts } from '@/utils/contactAllocations';
import type { SelectedPerson, SplitMode } from '@/utils/contactAllocations';
import { createTransactionSaveGuard, getTransactionDefaults, hasTransactionBudget, shouldReturnToTransactionAfterBudget } from '@/utils/transactionComposerPolicy';
import { getFloatingDockLayout } from '@/utils/floatingDockLayout';

type AddNavigation = BottomTabNavigationProp<AppTabParamList, 'Add'>;

function AnimatedChoices({ expanded, children }: { expanded: boolean; children: ReactNode }) {
  const { duration } = useAppMotion();
  const [contentHeight, setContentHeight] = useState(0);
  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded ? contentHeight : 0, { duration, easing: Easing.out(Easing.cubic) }),
    opacity: withTiming(expanded ? 1 : 0, { duration: duration ? 150 : 0 }),
  }), [contentHeight, duration, expanded]);

  return (
    <Animated.View
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      pointerEvents={expanded ? 'auto' : 'none'}
      style={[localStyles.choicesClip, animatedStyle]}
    >
      <View onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)} style={localStyles.choicesContent}>
        {children}
      </View>
    </Animated.View>
  );
}

function AnimatedChevron({ expanded, color }: { expanded: boolean; color: string }) {
  const { duration } = useAppMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(expanded ? '180deg' : '0deg', { duration }) }],
  }), [duration, expanded]);
  return <Animated.View style={animatedStyle}><AppIcon name="chevron-down" size={18} color={color} /></Animated.View>;
}

export function RecordTransactionScreen() {
  const navigation = useNavigation<AddNavigation>();
  const { colors } = useTheme();
  const { duration } = useAppMotion();
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const basicMode = useHomeModeStore((state) => state.mode === 'basic');
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { contentPaddingBottom } = getFloatingDockLayout(fontScale, insets.bottom, basicMode);
  const addTransaction = useTransactionStore((state) => state.addTransactionDurable);
  const allowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const [defaults] = useState(() => getTransactionDefaults(useTransactionStore.getState().transactions, user?.id ?? 'local'));
  const saveGuard = useRef(createTransactionSaveGuard());
  const budgetReturnRequested = useRef(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(defaults.paymentMethod);
  const [date, setDate] = useState<string | null>(defaults.date);
  const [people, setPeople] = useState<SelectedPerson[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openPanel, setOpenPanel] = useState<'category' | 'payment' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectorWidth, setSelectorWidth] = useState(0);
  const selectorPosition = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(type === 'income' ? Math.max(0, (selectorWidth - 2) / 2) : 0, { duration, easing: Easing.out(Easing.cubic) }) }],
  }), [type, selectorWidth, duration]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useFocusEffect(useCallback(() => { saveGuard.current.reset(); }, []));
  useEffect(() => {
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    // Subscribe directly so return works even while the tab's rendering is frozen.
    const unsubscribeBudget = useBudgetStore.subscribe((next, previous) => {
      const state = parent?.getState();
      const currentRoute = state?.routes[state.index]?.name ?? '';
      if (shouldReturnToTransactionAfterBudget(budgetReturnRequested.current, previous.settings.monthly_allowance, next.settings.monthly_allowance, currentRoute) && parent?.canGoBack()) {
        budgetReturnRequested.current = false;
        parent.goBack();
      }
    });
    const unsubscribeNavigation = parent?.addListener('state', () => {
      const state = parent.getState();
      if (state.routes[state.index]?.name !== 'Budget') budgetReturnRequested.current = false;
    });
    return () => { unsubscribeBudget(); unsubscribeNavigation?.(); };
  }, [navigation]);
  const openBudget = () => {
    budgetReturnRequested.current = true;
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Budget');
  };

  const returnToPreviousScreen = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const selectType = (nextType: TransactionType) => {
    if (nextType === type) return;
    setFormError(null);
    setType(nextType);
    setCategory(null);
    setPeople([]);
    setSplitMode('equal');
    setCustomAmounts({});
    setOpenPanel(null);
  };

  const submit = async () => {
    if (!hasTransactionBudget(useBudgetStore.getState().settings.monthly_allowance)) {
      setFormError('Set a monthly budget before adding transactions. Your unfinished transaction is kept here.');
      return;
    }
    const numericAmount = Number(amount);
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount.trim()) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Enter an amount greater than zero, with up to two decimal places.');
      return;
    }
    if (!description.trim()) {
      setFormError('Add a short description for this transaction.');
      return;
    }
    if (!category) {
      setFormError('Choose a category for this transaction.');
      return;
    }
    if (!date || !isAllowedTransactionDate(date)) {
      setFormError('Choose a transaction date that is not in the future.');
      return;
    }
    if (!paymentMethod) {
      setFormError('Choose a payment method.');
      return;
    }
    const allocation = allocateContacts(amount, people, splitMode, customAmounts);
    if (allocation.allocations === null) {
      setFormError(allocation.error);
      return;
    }

    setFormError(null);
    setIsSaving(true);
    const result = await saveGuard.current.saveAsync(useBudgetStore.getState().settings.monthly_allowance, () => addTransaction({
      user_id: user?.id ?? 'local',
      type,
      amount: numericAmount,
      category,
      description: description.trim(),
      payment_method: paymentMethod,
      transaction_date: date,
      ...(allocation.allocations.length ? {
        contact_allocations: allocation.allocations,
        contact_split_mode: people.length > 1 ? splitMode : 'equal',
      } : {}),
    }));
    setIsSaving(false);

    if (result === 'busy') return;
    if (result !== 'saved') {
      setFormError(result === 'budget-required'
        ? 'Set a monthly budget before adding transactions. Your unfinished transaction is kept here.'
        : result === 'rejected'
          ? 'A matching captured transaction already exists. Check Activity before adding it again.'
          : 'This transaction could not be saved. Your details are kept here; please try again.');
      return;
    }

    setAmount('');
    setDescription('');
    setCategory(null);
    setDate(getTransactionDefaults([], user?.id ?? 'local').date);
    setPeople([]);
    setSplitMode('equal');
    setCustomAmounts({});
    returnToPreviousScreen();
  };

  const selectedDate = fromLocalDateKey(date ?? '');
  const displayDate = selectedDate?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const selectedCategory = categories.find((item) => item.id === category);
  const selectedPaymentMethod = PAYMENT_METHODS.find((item) => item.id === paymentMethod);
  const togglePanel = (panel: 'category' | 'payment') => {
    setOpenPanel((current) => current === panel ? null : panel);
  };

  const header = <CenteredPageHeader title="New transaction" style={{ marginBottom: Spacing.lg }} leftAction={(
    <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={returnToPreviousScreen} style={localStyles.backButton}>
      <AppIcon name="arrow-left" size={23} color={colors.textPrimary} />
    </PressableScale>
  )} />;
  if (!hasTransactionBudget(allowance)) {
    return <SafeAreaView edges={['top']} style={[localStyles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        {header}
        <ScreenState icon="wallet-outline" title="Set your monthly budget first" body="MoneyKai needs a monthly budget before you can record income or expenses. Set it once, then return straight to this transaction. Any unfinished details stay here." actionLabel="Set monthly budget" onAction={openBudget} />
        {basicMode ? <Button title="Split a bill with a group" variant="outline" onPress={() => navigation.navigate('Groups', { startSplit: true })} style={{ marginTop: Spacing.lg }} /> : null}
      </ScrollView>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top']} style={[localStyles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[localStyles.scrollContent, { paddingBottom: Math.max(basicMode ? 92 : 116, contentPaddingBottom) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {header}

        <View style={localStyles.amountCard}>
          <View style={localStyles.typeSelector} onLayout={(event) => setSelectorWidth(event.nativeEvent.layout.width)}>
            {selectorWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[localStyles.typeIndicator, { width: (selectorWidth - 2) / 2 }, selectorPosition]}
              />
            ) : null}
            {(['expense', 'income'] as const).map((item) => {
              const active = type === item;
              const label = item === 'expense' ? 'Debit' : 'Credit';
              const textColor = active ? '#000000' : item === 'expense'
                ? TransactionDirectionColorOnDark.debit
                : TransactionDirectionColorOnDark.credit;
              return (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  key={item}
                  onPress={() => selectType(item)}
                  style={localStyles.typeOption}
                >
                  <AppIcon color={active ? '#000000' : '#FFFFFF'} name={item === 'expense' ? 'arrow-top-right' : 'arrow-bottom-left'} size={18} />
                  <Text style={[localStyles.typeText, { color: textColor }]}>
                    {label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <Text style={localStyles.amountLabel}>AMOUNT</Text>
          <View style={localStyles.amountInputRow}>
            <Text style={localStyles.currencySymbol}>{currencySymbol}</Text>
            <TextInput
              accessibilityLabel="Amount"
              autoCapitalize="none"
              keyboardType="decimal-pad"
              inputMode="decimal"
              onChangeText={(text) => { setAmount(text); if (formError) setFormError(null); }}
              placeholder="0"
              placeholderTextColor="#FFFFFF"
              selectionColor="#FFFFFF"
              style={localStyles.amountInput}
              value={amount}
            />
          </View>
        </View>

        {formError ? (
          <ScreenState
            actionLabel={formError.startsWith('Set a monthly budget') ? 'Open Budget' : undefined}
            body={formError}
            icon="alert-circle-outline"
            onAction={formError.startsWith('Set a monthly budget') ? openBudget : undefined}
            style={localStyles.formError}
            title="Needs attention"
            tone="danger"
          />
        ) : null}

        <Text style={[localStyles.fieldLabel, { color: colors.textSecondary }]}>DESCRIPTION</Text>
        <View style={[localStyles.descriptionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppIcon name="text" size={21} color={colors.textTertiary} />
          <TextInput
            accessibilityLabel="Description"
            onChangeText={(text) => { setDescription(text); if (formError) setFormError(null); }}
            placeholder="Transaction description"
            placeholderTextColor={colors.textTertiary}
            style={[localStyles.descriptionInput, { color: colors.textPrimary }]}
            value={description}
          />
        </View>

        <View style={localStyles.detailRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={selectedCategory ? `Category, ${selectedCategory.name}` : 'Choose category'}
            accessibilityState={{ expanded: openPanel === 'category' }}
            onPress={() => togglePanel('category')}
            style={[localStyles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: selectedCategory ? 'space-between' : 'center' }]}
          >
            {selectedCategory ? <Text style={[localStyles.cardLabel, { color: colors.textSecondary }]}>CATEGORY</Text> : null}
            <View style={[localStyles.detailValueRow, !selectedCategory && { marginTop: 0 }]}>
              <AppIcon name={selectedCategory?.icon ?? 'view-dashboard-outline'} size={18} color={selectedCategory ? colors.textPrimary : colors.textSecondary} />
              <Text numberOfLines={2} style={[localStyles.detailValue, { color: selectedCategory ? colors.textPrimary : colors.textSecondary }]}>{selectedCategory?.name ?? 'Category'}</Text>
              <AppIcon name="chevron-right" size={17} color={colors.textSecondary} />
            </View>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={displayDate ? `Date, ${displayDate}` : 'Choose date'}
            onPress={() => { setOpenPanel(null); setShowDatePicker(true); }}
            style={[localStyles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: displayDate ? 'space-between' : 'center' }]}
          >
            {displayDate ? <Text style={[localStyles.cardLabel, { color: colors.textSecondary }]}>DATE</Text> : null}
            <View style={[localStyles.detailValueRow, !displayDate && { marginTop: 0 }]}>
              <AppIcon name="calendar-month-outline" size={18} color={displayDate ? colors.textPrimary : colors.textSecondary} />
              <Text numberOfLines={2} style={[localStyles.detailValue, { color: displayDate ? colors.textPrimary : colors.textSecondary }]}>{displayDate ?? 'Date'}</Text>
              <AppIcon name="chevron-right" size={17} color={colors.textSecondary} />
            </View>
          </PressableScale>
        </View>
        <AnimatedChoices expanded={openPanel === 'category'}>
          <View style={[localStyles.choicePanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={localStyles.chipRow}>
              {categories.map((item) => {
                const active = category === item.id;
                return (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={item.id}
                    onPress={() => { setCategory(item.id); setFormError(null); setOpenPanel(null); }}
                    style={[localStyles.choiceChip, { borderColor: active ? '#000000' : colors.border, backgroundColor: active ? '#000000' : colors.surface }]}
                  >
                    <AppIcon name={item.icon} size={16} color={active ? '#FFFFFF' : colors.textPrimary} />
                    <Text style={[localStyles.chipText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{item.name}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        </AnimatedChoices>
        <View style={localStyles.peopleBox}>
          <PeopleAllocationField
            amount={amount}
            currencySymbol={currencySymbol}
            people={people}
            onPeopleChange={(next) => { setPeople(next); setFormError(null); }}
            mode={splitMode}
            onModeChange={(next) => { setSplitMode(next); setFormError(null); }}
            customAmounts={customAmounts}
            onCustomAmountsChange={(next) => { setCustomAmounts(next); setFormError(null); }}
          />
        </View>
        <View style={[localStyles.paymentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={selectedPaymentMethod ? `Payment method, ${selectedPaymentMethod.name}` : 'Choose payment method'}
            accessibilityState={{ expanded: openPanel === 'payment' }}
            onPress={() => togglePanel('payment')}
            style={localStyles.paymentTrigger}
          >
            <AppIcon name={selectedPaymentMethod?.icon ?? 'credit-card-outline'} size={20} color={selectedPaymentMethod ? colors.textPrimary : colors.textSecondary} />
            <Text numberOfLines={1} style={[localStyles.paymentValue, { color: selectedPaymentMethod ? colors.textPrimary : colors.textSecondary }]}>{selectedPaymentMethod?.name ?? 'Payment method'}</Text>
            <AnimatedChevron expanded={openPanel === 'payment'} color={colors.textPrimary} />
          </PressableScale>
          <AnimatedChoices expanded={openPanel === 'payment'}>
            <View style={[localStyles.paymentChoices, { borderTopColor: colors.borderLight }]}>
              <View style={localStyles.chipRow}>
                {PAYMENT_METHODS.map((item) => {
                  const active = paymentMethod === item.id;
                  return (
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={item.id}
                      onPress={() => { setPaymentMethod(item.id); setFormError(null); setOpenPanel(null); }}
                      style={[localStyles.choiceChip, { borderColor: active ? '#000000' : colors.border, backgroundColor: active ? '#000000' : colors.surface }]}
                    >
                      <AppIcon name={item.icon} size={16} color={active ? '#FFFFFF' : colors.textPrimary} />
                      <Text style={[localStyles.chipText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{item.name}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          </AnimatedChoices>
        </View>

        {basicMode ? <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Split a bill with a group"
          accessibilityHint="Opens the shared expense flow; your unfinished transaction stays here"
          onPress={() => navigation.navigate('Groups', { startSplit: true })}
          style={[localStyles.splitBillAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon name="account-group-outline" size={21} color={colors.textPrimary} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[localStyles.splitBillTitle, { color: colors.textPrimary }]}>Split a bill</Text>
            <Text style={[localStyles.splitBillDescription, { color: colors.textSecondary }]}>Add a shared expense to a group</Text>
          </View>
          <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
        </PressableScale> : null}

        <Button title="Add transaction" onPress={submit} loading={isSaving} style={localStyles.submitButton} />
      </ScrollView>
      <TransactionCalendar
        visible={showDatePicker}
        value={date}
        onClose={() => setShowDatePicker(false)}
        onSelect={(nextDate) => { setDate(nextDate); setFormError(null); setShowDatePicker(false); }}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 116 },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  amountCard: { backgroundColor: '#050505', borderRadius: BorderRadius.xl, marginBottom: Spacing.xl, padding: Spacing.lg },
  typeSelector: { borderColor: '#3A3A3A', borderRadius: BorderRadius.full, borderWidth: 1, flexDirection: 'row', marginBottom: Spacing.xl, minHeight: 46, overflow: 'hidden' },
  typeIndicator: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.full, bottom: 0, left: 0, position: 'absolute', top: 0 },
  typeOption: { alignItems: 'center', borderRadius: BorderRadius.full, flex: 1, flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', minHeight: 44 },
  typeText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md },
  amountLabel: { color: '#EAEAEA', fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, letterSpacing: 1 },
  amountInputRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, minHeight: 76 },
  currencySymbol: { color: '#FFFFFF', fontFamily: Typography.fontFamily.regular, fontSize: 43 },
  amountInput: { color: '#FFFFFF', flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: 48, minWidth: 0, paddingVertical: 0 },
  formError: { marginBottom: Spacing.base, padding: Spacing.base },
  fieldLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.8, marginBottom: Spacing.sm },
  descriptionBox: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 58, paddingHorizontal: Spacing.base },
  descriptionInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, minWidth: 0, paddingVertical: Spacing.md },
  detailRow: { flexDirection: 'row', gap: Spacing.md, marginHorizontal: Spacing.sm, marginTop: Spacing.lg },
  detailCard: { borderRadius: BorderRadius.md, borderWidth: 1, flex: 1, justifyContent: 'space-between', minHeight: 68, minWidth: 0, padding: Spacing.md },
  cardLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.8 },
  detailValueRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  detailValue: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, minWidth: 0 },
  choicesClip: { overflow: 'hidden' },
  choicesContent: { left: 0, position: 'absolute', right: 0, top: 0 },
  choicePanel: { borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.sm, padding: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  choiceChip: { alignItems: 'center', borderRadius: BorderRadius.full, borderWidth: 1, flexDirection: 'row', gap: Spacing.sm, minHeight: 44, paddingHorizontal: Spacing.md },
  chipText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm },
  paymentBox: { borderRadius: BorderRadius.md, borderWidth: 1, marginHorizontal: Spacing.sm, marginTop: Spacing.lg, overflow: 'hidden' },
  peopleBox: { marginHorizontal: Spacing.sm, marginTop: Spacing.lg },
  paymentTrigger: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, minHeight: 64, paddingHorizontal: Spacing.md },
  paymentValue: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, textAlignVertical: 'center' },
  paymentChoices: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.md },
  splitBillAction: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, marginHorizontal: Spacing.sm, marginTop: Spacing.lg, minHeight: 64, paddingHorizontal: Spacing.md },
  splitBillTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md },
  splitBillDescription: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, marginTop: 2 },
  submitButton: { alignSelf: 'center', backgroundColor: '#000000', borderRadius: BorderRadius.full, marginTop: Spacing['2xl'], maxWidth: 260, minHeight: 48, minWidth: 190, width: '68%' },
});
