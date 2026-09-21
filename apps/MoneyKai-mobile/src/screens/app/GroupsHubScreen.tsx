import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import type { Group } from '@/types/group';
import { createAppScreenStyles, formatDate } from './screenStyles';

const GROUP_TYPES: Group['type'][] = ['friends', 'flatmates', 'trip', 'event'];

export function GroupsHubScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const groups = useGroupStore((state) => state.groups);
  const expenses = useGroupStore((state) => state.expenses);
  const addGroup = useGroupStore((state) => state.addGroup);
  const deleteGroup = useGroupStore((state) => state.deleteGroup);
  const archiveGroup = useGroupStore((state) => state.archiveGroup);
  const restoreGroup = useGroupStore((state) => state.restoreGroup);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Group['type']>('friends');

  const totals = useMemo(() => {
    const result = new Map<string, number>();
    expenses.forEach((expense) => result.set(expense.group_id, (result.get(expense.group_id) ?? 0) + expense.amount));
    return result;
  }, [expenses]);

  const createGroup = () => {
    if (!name.trim()) {
      Alert.alert('Group name needed', 'Add a name before creating this group.');
      return;
    }
    addGroup({ created_by: user?.id ?? 'local', name: name.trim(), type, description: description.trim() || `${type} group`, archived: false });
    setName('');
    setDescription('');
  };

  const confirmDelete = (group: Group) => Alert.alert(
    `Delete ${group.name}?`,
    'This removes the group and its local group records. This action cannot be undone.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(group.id) }]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <FlatList
        contentContainerStyle={styles.scrollContent}
        data={groups}
        keyExtractor={(group) => group.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <ScreenBackButton />
              <Text style={styles.title}>Shared expenses</Text>
              <Text style={styles.subtitle}>Keep the active groups visible. Creation and destructive controls appear only when needed.</Text>
            </View>
            <View style={styles.panel}>
              <Disclosure title="Create a group" summary="For a trip, home, family, or shared plan">
                <Input label="Name" value={name} onChangeText={setName} placeholder="Goa trip, flatmates…" icon="account-group-outline" required />
                <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional context" icon="file-document-outline" />
                <View style={styles.chipRow}>
                  {GROUP_TYPES.map((item) => (
                    <PressableScale accessibilityRole="button" accessibilityState={{ selected: type === item }} key={item} onPress={() => setType(item)} style={[styles.chip, type === item && styles.chipActive]}>
                      <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
                    </PressableScale>
                  ))}
                </View>
                <Button title="Create group" onPress={createGroup} icon="plus" />
              </Disclosure>
            </View>
          </>
        }
        ListEmptyComponent={<ScreenState kind="empty" title="No groups yet" body="Create one when an expense needs to be shared with other people." />}
        renderItem={({ item }) => (
          <View style={styles.panel}>
            <View style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.value}>{item.name}</Text>
                <Text style={styles.muted}>{item.type} · {currencySymbol}{(totals.get(item.id) ?? 0).toLocaleString('en-IN')} · {formatDate(item.created_at)}</Text>
              </View>
              {item.archived ? <Text style={[styles.muted, { color: colors.warning }]}>Archived</Text> : null}
            </View>
            {item.description ? <Text style={[styles.muted, { marginTop: Spacing.sm }]}>{item.description}</Text> : null}
            <Disclosure title="Group controls" summary="Archive, restore, or delete this group">
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button title={item.archived ? 'Restore' : 'Archive'} variant="outline" icon="archive" onPress={() => item.archived ? restoreGroup(item.id) : archiveGroup(item.id)} style={{ flex: 1 }} />
                <PressableScale accessibilityLabel={`Delete ${item.name}`} accessibilityRole="button" onPress={() => confirmDelete(item)} style={{ alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
                  <AppIcon color={colors.error} name="trash-can-outline" size={21} />
                </PressableScale>
              </View>
            </Disclosure>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
