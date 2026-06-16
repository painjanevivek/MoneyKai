import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import type { Group } from '@/types/group';
import { createAppScreenStyles, formatDate } from './screenStyles';

const GROUP_TYPES: Group['type'][] = ['friends', 'flatmates', 'trip', 'event'];

export function GroupsScreen() {
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

  const groupTotals = useMemo(() => {
    const totals = new Map<string, number>();
    expenses.forEach((expense) => {
      totals.set(expense.group_id, (totals.get(expense.group_id) ?? 0) + expense.amount);
    });
    return totals;
  }, [expenses]);

  const createGroup = () => {
    if (!name.trim()) {
      Alert.alert('Group name needed', 'Add a name for this group.');
      return;
    }

    addGroup({
      created_by: user?.id ?? 'local',
      name: name.trim(),
      type,
      description: description.trim() || `${type} group`,
      archived: false,
    });
    setName('');
    setDescription('');
  };

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  const renderGroup = React.useCallback(
    ({ item: group }: { item: Group }) => {
      const groupTotal = groupTotals.get(group.id) ?? 0;

      return (
        <View style={styles.panel}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.value}>{group.name}</Text>
              <Text style={styles.muted}>
                {group.type} - {formatMoney(groupTotal)} - {formatDate(group.created_at)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => (group.archived ? restoreGroup(group.id) : archiveGroup(group.id))}
              style={{ padding: Spacing.sm }}
            >
              <MaterialCommunityIcons
                name={group.archived ? 'archive-arrow-up-outline' : 'archive-outline'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteGroup(group.id)} style={{ padding: Spacing.sm }}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
          <Text style={{ ...styles.muted, marginTop: Spacing.sm }}>{group.description}</Text>
        </View>
      );
    },
    [archiveGroup, colors.error, colors.textSecondary, deleteGroup, formatMoney, groupTotals, restoreGroup, styles]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Groups</Text>
              <Text style={styles.title}>Shared expenses</Text>
              <Text style={styles.subtitle}>Create groups and keep shared money records synced to your account.</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>New group</Text>
              <Input label="Name" value={name} onChangeText={setName} placeholder="Goa trip, flatmates..." icon="account-group-outline" />
              <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional" icon="text" />
              <View style={styles.chipRow}>
                {GROUP_TYPES.map((item) => {
                  const active = item === type;
                  return (
                    <TouchableOpacity key={item} onPress={() => setType(item)} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Button title="Create Group" onPress={createGroup} icon="plus" />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No groups yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
