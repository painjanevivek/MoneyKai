import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { SplitBillSheet } from '@/components/groups/SplitBillSheet';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatRelativeDate } from '@/utils/dateUtils';
import { simplifyDebts } from '@/utils/debtSimplification';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const GROUP_TYPE_ICONS: Record<string, string> = {
  flatmates: 'home-group',
  friends: 'account-group',
  trip: 'airplane',
  event: 'party-popper',
};

const GROUP_TYPE_COLORS: Record<string, string> = {
  flatmates: '#111111',
  friends: '#3A3A3A',
  trip: '#5A5A5A',
  event: '#737373',
};

type GroupView = 'active' | 'archived';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? 'local');
  const userName = useAuthStore((s) => s.user?.full_name ?? 'You');
  const { groups, addGroup, settleExpense, getGroupExpenses, archiveGroup, restoreGroup, deleteGroup } = useGroupStore();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showSplitBillSheet, setShowSplitBillSheet] = useState(false);
  const [actionGroupId, setActionGroupId] = useState<string | null>(null);
  const [groupView, setGroupView] = useState<GroupView>('active');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'flatmates' | 'friends' | 'trip' | 'event'>('friends');

  const filteredGroups = useMemo(
    () => groups.filter((group) => (group.archived ? 'archived' : 'active') === groupView),
    [groups, groupView]
  );

  const archivedCount = groups.filter((group) => group.archived).length;
  const activeCount = groups.length - archivedCount;

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    addGroup({ created_by: userId, name: newGroupName, type: newGroupType, description: '', archived: false });
    setShowCreateModal(false);
    setNewGroupName('');
  };

  const openGroupActions = (groupId: string) => {
    setActionGroupId(groupId);
    setShowActionModal(true);
  };

  const selectedGroupData = groups.find((group) => group.id === selectedGroup);
  const groupExpenses = selectedGroup ? getGroupExpenses(selectedGroup) : [];

  const debtEdges = groupExpenses.flatMap((expense) =>
    (expense.splits || [])
      .filter((split) => !split.is_settled)
      .map((split) => ({
        from: split.user_id,
        to: expense.paid_by,
        amount: split.amount,
        fromName: split.user_name,
        toName: expense.paid_by_name,
      }))
  );
  const simplifiedDebts = simplifyDebts(debtEdges);

  const actionGroup = groups.find((group) => group.id === actionGroupId);

  const handleArchiveToggle = () => {
    if (!actionGroupId) return;
    if (actionGroup?.archived) {
      restoreGroup(actionGroupId);
    } else {
      archiveGroup(actionGroupId);
    }
    setShowActionModal(false);
    setActionGroupId(null);
  };

  const handleDeleteGroup = () => {
    if (!actionGroupId) return;
    Alert.alert('Delete Group', 'This will permanently remove the group and all its expenses.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGroup(actionGroupId);
          if (selectedGroup === actionGroupId) {
            setSelectedGroup(null);
          }
        },
      },
    ]);
    setShowActionModal(false);
    setActionGroupId(null);
  };

  if (selectedGroup && selectedGroupData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md }}>
          <TouchableOpacity onPress={() => setSelectedGroup(null)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>{selectedGroupData.name}</Text>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>
              {selectedGroupData.members?.length || 0} members • {groupExpenses.length} expenses
            </Text>
          </View>
          <TouchableOpacity onPress={() => openGroupActions(selectedGroupData.id)} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }}>
          {selectedGroupData.archived && (
            <Card style={{ marginBottom: Spacing.md, borderColor: `${colors.accent}40`, backgroundColor: colors.primaryBg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="archive-outline" size={18} color={colors.accent} />
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                  This group is archived. Restore it from the menu to bring it back to active groups.
                </Text>
              </View>
            </Card>
          )}

          <Button
            title="Share split bill"
            onPress={() => setShowSplitBillSheet(true)}
            variant="outline"
            icon="share-variant-outline"
            fullWidth
            style={{ marginBottom: Spacing.md }}
          />

          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Members</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {selectedGroupData.members?.map((member) => (
                <View
                  key={member.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.primaryBg,
                    borderRadius: BorderRadius.full,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 6,
                  }}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.bold, color: colors.textInverse }}>{member.user_name?.[0] || '?'}</Text>
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{member.user_name}</Text>
                  {member.role === 'admin' && <MaterialCommunityIcons name="crown" size={12} color={colors.accent} />}
                </View>
              ))}
            </View>
          </Card>

          {simplifiedDebts.length > 0 && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Who Owes Whom</Text>
              {simplifiedDebts.map((debt, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: Spacing.sm,
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.borderLight,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>{debt.fromName || 'User'}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textTertiary} />
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>{debt.toName || 'User'}</Text>
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(debt.amount)}</Text>
                </View>
              ))}
            </Card>
          )}

          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Expenses</Text>
          {groupExpenses.map((expense) => (
            <Card key={expense.id} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <View>
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{expense.description}</Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>Paid by {expense.paid_by_name} • {formatRelativeDate(expense.created_at)}</Text>
                </View>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(expense.amount)}</Text>
              </View>
              {expense.splits?.map((split) => (
                <View
                  key={split.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{split.user_name} owes</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{formatCurrency(split.amount)}</Text>
                    <TouchableOpacity
                      onPress={() => !split.is_settled && settleExpense(split.id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: BorderRadius.full,
                        backgroundColor: split.is_settled ? colors.primaryBg : colors.emergencyBg,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: split.is_settled ? colors.primary : colors.emergency }}>
                        {split.is_settled ? 'Settled' : 'Pending'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>

        <SplitBillSheet
          key={`${selectedGroupData.id}-${showSplitBillSheet ? 'open' : 'closed'}`}
          visible={showSplitBillSheet}
          groupName={selectedGroupData.name}
          payerName={userName}
          onClose={() => setShowSplitBillSheet(false)}
        />

        <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
          <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: Spacing.base }}>
            <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.lg, shadowColor: colors.shadowColor }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Group actions
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, marginBottom: Spacing.md }}>
                Choose what you want to do with {actionGroup?.name}.
              </Text>
              <View style={{ gap: Spacing.sm }}>
                <Button
                  title={actionGroup?.archived ? 'Restore Group' : 'Archive Group'}
                  onPress={handleArchiveToggle}
                  variant="outline"
                  icon={actionGroup?.archived ? 'archive-arrow-up-outline' : 'archive-outline'}
                />
                <Button
                  title="Delete Group"
                  onPress={handleDeleteGroup}
                  variant="outline"
                  icon="trash-can-outline"
                  textStyle={{ color: colors.emergency }}
                  style={{ borderColor: colors.emergency }}
                />
                <Button title="Cancel" onPress={() => setShowActionModal(false)} variant="ghost" />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Groups</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Split expenses with friends and flatmates</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => setGroupView('active')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: BorderRadius.full,
            alignItems: 'center',
            backgroundColor: groupView === 'active' ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: groupView === 'active' ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: groupView === 'active' ? colors.textInverse : colors.textPrimary }}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setGroupView('archived')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: BorderRadius.full,
            alignItems: 'center',
            backgroundColor: groupView === 'archived' ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: groupView === 'archived' ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: groupView === 'archived' ? colors.textInverse : colors.textPrimary }}>
            Archived ({archivedCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }}>
        {filteredGroups.map((group) => {
          const color = GROUP_TYPE_COLORS[group.type] || colors.primary;
          const icon = GROUP_TYPE_ICONS[group.type] || 'account-group';

          return (
            <TouchableOpacity key={group.id} onPress={() => setSelectedGroup(group.id)} activeOpacity={0.7}>
              <Card style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight, borderRadius: 0, paddingHorizontal: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: BorderRadius.md,
                      backgroundColor: `${color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name={icon as any} size={24} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{group.name}</Text>
                      {group.archived && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: colors.borderLight }}>
                          <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>Archived</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>
                      {group.members?.length || 0} members • {formatRelativeDate(group.created_at)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <TouchableOpacity onPress={() => openGroupActions(group.id)} hitSlop={10}>
                      <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(group.total_expenses || 0)}</Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>total</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: Spacing.md, gap: -8 }}>
                  {group.members?.slice(0, 4).map((member, index) => (
                    <View
                      key={member.id}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: [colors.primary, colors.primaryLight, colors.accent, colors.textTertiary][index % 4],
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: colors.background,
                        marginLeft: index > 0 ? -8 : 0,
                        zIndex: 10 - index,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.bold, color: colors.textInverse }}>{member.user_name?.[0]}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        {filteredGroups.length === 0 && (
          <EmptyState
            icon={groupView === 'archived' ? 'archive-outline' : 'account-group-outline'}
            title={groupView === 'archived' ? 'No Archived Groups' : 'No Groups Yet'}
            message={groupView === 'archived' ? 'Archived groups will appear here.' : 'Create a group to start splitting expenses.'}
          />
        )}
      </ScrollView>

      <Pressable
        onPress={() => setShowCreateModal(true)}
        style={({ hovered, pressed }: any) => ({
          position: 'absolute',
          bottom: insets.bottom + 96,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...Shadows.lg,
          shadowColor: colors.primary,
          borderWidth: 1,
          borderColor: hovered ? colors.primaryLight : colors.primary,
          transform: hovered && !pressed ? [{ translateY: -2 }, { scale: 1.04 }] : [{ translateY: 0 }, { scale: 1 }],
        })}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.textInverse} />
      </Pressable>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Create Group</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Group Name" placeholder="e.g., Flat 302" value={newGroupName} onChangeText={setNewGroupName} icon="account-group-outline" />
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.sm }}>Group Type</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
              {(['flatmates', 'friends', 'trip', 'event'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewGroupType(type)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.md,
                    backgroundColor: newGroupType === type ? `${GROUP_TYPE_COLORS[type]}15` : colors.surface,
                    borderWidth: 1.5,
                    borderColor: newGroupType === type ? GROUP_TYPE_COLORS[type] : colors.border,
                  }}
                >
                  <MaterialCommunityIcons name={GROUP_TYPE_ICONS[type] as any} size={22} color={newGroupType === type ? GROUP_TYPE_COLORS[type] : colors.textTertiary} />
                  <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, marginTop: 4, textTransform: 'capitalize', color: newGroupType === type ? GROUP_TYPE_COLORS[type] : colors.textSecondary }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Create Group" onPress={handleCreateGroup} fullWidth size="lg" icon="check" />
          </View>
        </View>
      </Modal>

      <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: Spacing.base }}>
          <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.lg, shadowColor: colors.shadowColor }}>
            <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
              Group actions
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, marginBottom: Spacing.md }}>
              Choose what you want to do with {actionGroup?.name}.
            </Text>
            <View style={{ gap: Spacing.sm }}>
              <Button
                title={actionGroup?.archived ? 'Restore Group' : 'Archive Group'}
                onPress={handleArchiveToggle}
                variant="outline"
                icon={actionGroup?.archived ? 'archive-arrow-up-outline' : 'archive-outline'}
              />
              <Button
                title="Delete Group"
                onPress={handleDeleteGroup}
                variant="outline"
                icon="trash-can-outline"
                textStyle={{ color: colors.emergency }}
                style={{ borderColor: colors.emergency }}
              />
              <Button title="Cancel" onPress={() => setShowActionModal(false)} variant="ghost" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
