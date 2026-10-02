import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from './AppText';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { PressableScale } from './PressableScale';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useTheme } from '@/hooks/useTheme';
import type { SelectedPerson } from '@/utils/contactAllocations';
import { readContactDirectory } from '@/services/contactDirectory';

type PickerState = 'checking' | 'permission' | 'denied' | 'loading' | 'ready' | 'error';
type Row = { kind: 'heading'; letter: string } | { kind: 'person'; person: SelectedPerson };
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const firstLetter = (name: string) => {
  const letter = name.trim().charAt(0).toUpperCase();
  return ALPHABET.includes(letter) ? letter : '#';
};

export function ContactPickerModal({ visible, selected, onApply, onClose }: {
  visible: boolean;
  selected: SelectedPerson[];
  onApply: (people: SelectedPerson[]) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { reduceMotion } = useAppMotion();
  const listRef = useRef<FlatList<Row>>(null);
  const [state, setState] = useState<PickerState>('checking');
  const [contacts, setContacts] = useState<SelectedPerson[]>([]);
  const [draft, setDraft] = useState<SelectedPerson[]>(selected);
  const [query, setQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const generation = useRef(0);
  const inFlight = useRef<number | null>(null);

  const refreshContacts = async (requestAccess: boolean) => {
    const epoch = generation.current;
    if (inFlight.current === epoch) return;
    inFlight.current = epoch;
    setState('checking');
    try {
      const result = await readContactDirectory(requestAccess);
      if (epoch !== generation.current) return;
      setContacts(result.people);
      setState(result.state);
    } catch {
      if (epoch === generation.current) { setContacts([]); setState('error'); }
    } finally {
      if (inFlight.current === epoch) inFlight.current = null;
    }
  };

  useEffect(() => {
    generation.current += 1;
    if (!visible) { setContacts([]); setDraft([]); setQuery(''); setManualName(''); return; }
    setDraft(selected);
    setQuery('');
    setManualName('');
    // Opening Choose people is the explicit user action requesting contact access.
    void refreshContacts(true);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void refreshContacts(false);
    });
    return () => { generation.current += 1; subscription.remove(); };
    // A selection is drafted only when the picker opens, not on each parent rerender.
  }, [visible]);

  const togglePerson = (person: SelectedPerson) => setDraft((current) =>
    current.some((item) => item.contactId === person.contactId)
      ? current.filter((item) => item.contactId !== person.contactId)
      : [...current, person]);

  const addManually = () => {
    const name = manualName.trim();
    if (!name || draft.some((person) => person.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    setDraft((current) => [...current, { contactId: `manual:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`, name }]);
    setManualName('');
  };

  const filtered = useMemo(() => contacts.filter((person) => person.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [contacts, query]);
  const { rows, indices, offsets } = useMemo(() => {
    const nextRows: Row[] = [];
    const nextIndices = new Map<string, number>();
    const nextOffsets: number[] = [];
    let offset = 0;
    for (const person of filtered) {
      const letter = firstLetter(person.name);
      if (!nextIndices.has(letter)) {
        nextIndices.set(letter, nextRows.length);
        nextOffsets.push(offset);
        nextRows.push({ kind: 'heading', letter });
        offset += 30;
      }
      nextOffsets.push(offset);
      nextRows.push({ kind: 'person', person });
      offset += 58;
    }
    return { rows: nextRows, indices: nextIndices, offsets: nextOffsets };
  }, [filtered]);

  const renderItem: ListRenderItem<Row> = ({ item }) => {
    if (item.kind === 'heading') return <View style={[styles.heading, { backgroundColor: colors.background }]}><Text style={[styles.headingText, { color: colors.textSecondary }]}>{item.letter}</Text></View>;
    const checked = draft.some((person) => person.contactId === item.person.contactId);
    return <PressableScale accessibilityRole="checkbox" accessibilityLabel={item.person.name} accessibilityState={{ checked }} onPress={() => togglePerson(item.person)} style={[styles.contactRow, { borderBottomColor: colors.borderLight }]}>
      <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.avatarText, { color: colors.textPrimary }]}>{item.person.name.charAt(0).toUpperCase()}</Text></View>
      <Text numberOfLines={1} style={[styles.contactName, { color: colors.textPrimary }]}>{item.person.name}</Text>
      <View style={[styles.checkbox, { backgroundColor: checked ? colors.textPrimary : colors.surface, borderColor: checked ? colors.textPrimary : colors.border }]}>{checked ? <AppIcon name="check" size={15} color={colors.card} /> : null}</View>
    </PressableScale>;
  };

  return <Modal visible={visible} animationType={reduceMotion ? 'none' : 'slide'} presentationStyle="fullScreen" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Close contacts" onPress={onClose} style={styles.closeButton}><AppIcon name="close" size={23} color={colors.textPrimary} /></PressableScale>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Choose people</Text>
        <View style={styles.closeButton} />
      </View>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon name="magnify" size={19} color={colors.textSecondary} />
        <TextInput accessibilityLabel="Search contacts" placeholder="Search contacts" placeholderTextColor={colors.textTertiary} value={query} onChangeText={setQuery} style={[styles.searchInput, { color: colors.textPrimary }]} />
        {query ? <PressableScale accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearSearch}><AppIcon name="close" size={17} color={colors.textSecondary} /></PressableScale> : null}
      </View>
      {draft.length ? <View style={styles.selectedRow}>
        <Text style={[styles.selectedText, { color: colors.textSecondary }]}>{draft.length} selected</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.selectedChips}>
          {draft.map((person) => <PressableScale key={person.contactId} accessibilityRole="button" accessibilityLabel={`Remove ${person.name}`} onPress={() => togglePerson(person)} style={[styles.selectedChip, { backgroundColor: colors.surfaceElevated }]}>
            <Text numberOfLines={1} style={[styles.selectedChipText, { color: colors.textPrimary }]}>{person.name}</Text>
            <AppIcon name="close" size={14} color={colors.textSecondary} />
          </PressableScale>)}
        </ScrollView>
      </View> : null}

      {state === 'ready' ? <View style={styles.listArea}>
        {rows.length ? <FlatList ref={listRef} data={rows} keyExtractor={(item) => item.kind === 'heading' ? `heading:${item.letter}` : `person:${item.person.contactId}`} renderItem={renderItem} getItemLayout={(_, index) => ({ index, length: rows[index].kind === 'heading' ? 30 : 58, offset: offsets[index] })} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Spacing['2xl'], paddingRight: 34 }} initialNumToRender={28} windowSize={7} showsVerticalScrollIndicator={false} />
          : <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{query ? 'No matching contacts. Try another name or add someone manually.' : 'No contacts found on this device. You can still add someone manually.'}</Text>}
        <View style={styles.indexRail}>{ALPHABET.map((letter) => <PressableScale key={letter} accessibilityRole="button" accessibilityLabel={`Jump to ${letter}`} accessibilityState={{ disabled: !indices.has(letter) }} disabled={!indices.has(letter)} onPress={() => listRef.current?.scrollToIndex({ index: indices.get(letter) ?? 0, animated: true })} style={styles.indexLetter}><Text style={[styles.indexText, { color: indices.has(letter) ? colors.textPrimary : colors.textTertiary }]}>{letter}</Text></PressableScale>)}</View>
      </View> : <View style={styles.permissionArea}>
        {state === 'checking' || state === 'loading' ? <ActivityIndicator color={colors.textPrimary} /> : <AppIcon name={state === 'error' ? 'alert-circle-outline' : 'account-group-outline'} size={32} color={colors.textPrimary} />}
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>{state === 'checking' ? 'Checking contacts…' : state === 'loading' ? 'Loading contacts…' : state === 'error' ? 'Contacts could not load' : state === 'denied' ? 'Contact access is off' : 'Find people on your phone'}</Text>
        <Text style={[styles.permissionBody, { color: colors.textSecondary }]}>{state === 'permission' ? 'Allow MoneyKai to show your contacts here. Only people you select are saved with this transaction and may sync with your MoneyKai data.' : state === 'denied' ? 'Allow contact access in system settings, or add a person by name below.' : state === 'error' ? 'Try loading again, or add a person by name below.' : 'Your full address book stays on this device.'}</Text>
        {state === 'permission' ? <Button title="Allow contacts" onPress={() => void refreshContacts(true)} /> : null}
        {state === 'denied' ? <Button title="Open settings" onPress={() => void Linking.openSettings()} /> : null}
        {state === 'error' ? <Button title="Try again" onPress={() => void refreshContacts(true)} /> : null}
      </View>}

      <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.background }]}>
        <View style={[styles.manualBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput accessibilityLabel="Add a person by name" placeholder="Or add someone by name" placeholderTextColor={colors.textTertiary} value={manualName} onChangeText={setManualName} onSubmitEditing={addManually} returnKeyType="done" style={[styles.manualInput, { color: colors.textPrimary }]} />
          <PressableScale accessibilityRole="button" accessibilityLabel="Add person by name" accessibilityState={{ disabled: !manualName.trim() }} disabled={!manualName.trim()} onPress={addManually} style={styles.manualAdd}><AppIcon name="plus" size={20} color={manualName.trim() ? colors.textPrimary : colors.textTertiary} /></PressableScale>
        </View>
        <Button title={draft.length ? `Add ${draft.length} ${draft.length === 1 ? 'person' : 'people'}` : 'Done'} onPress={() => onApply(draft)} fullWidth />
      </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: Spacing.lg },
  closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl },
  searchBox: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, minHeight: 48, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, minWidth: 0, paddingVertical: 0 },
  clearSearch: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 32 },
  selectedRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  selectedText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm },
  selectedChips: { gap: Spacing.sm, paddingTop: Spacing.sm },
  selectedChip: { alignItems: 'center', borderRadius: BorderRadius.full, flexDirection: 'row', gap: Spacing.sm, maxWidth: 170, minHeight: 36, paddingHorizontal: Spacing.md },
  selectedChipText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, maxWidth: 120 },
  listArea: { flex: 1 },
  heading: { justifyContent: 'center', height: 30, paddingHorizontal: Spacing.xl },
  headingText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm },
  contactRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.md, height: 58, marginLeft: Spacing.lg, paddingRight: Spacing.sm },
  avatar: { alignItems: 'center', borderRadius: BorderRadius.full, height: 38, justifyContent: 'center', width: 38 },
  avatarText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md },
  contactName: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  checkbox: { alignItems: 'center', borderRadius: BorderRadius.full, borderWidth: 1, height: 22, justifyContent: 'center', width: 22 },
  indexRail: { bottom: 0, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 32 },
  indexLetter: { alignItems: 'center', justifyContent: 'center', minHeight: 16 },
  indexText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10 },
  emptyText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: 21, paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'] },
  permissionArea: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: Spacing['2xl'], gap: Spacing.md },
  permissionTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, textAlign: 'center' },
  permissionBody: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: 21, textAlign: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  manualBox: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', minHeight: 46, paddingLeft: Spacing.md },
  manualInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, minWidth: 0, paddingVertical: 0 },
  manualAdd: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
});
