import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useGroupStore } from '@/stores/useGroupStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
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
  flatmates: '#3B82F6',
  friends: '#8B5CF6',
  trip: '#F4A261',
  event: '#EC4899',
};

export default function GroupsScreen() {
  const { colors } = useTheme();
  const { groups, addGroup, settleExpense, getGroupExpenses } = useGroupStore();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'flatmates' | 'friends' | 'trip' | 'event'>('friends');

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    addGroup({ created_by: 'demo', name: newGroupName, type: newGroupType, description: '' });
    setShowCreateModal(false);
    setNewGroupName('');
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);
  const groupExpenses = selectedGroup ? getGroupExpenses(selectedGroup) : [];

  // Calculate simplified debts for selected group
  const debtEdges = groupExpenses.flatMap(exp =>
    (exp.splits || [])
      .filter(s => !s.is_settled)
      .map(s => ({
        from: s.user_id,
        to: exp.paid_by,
        amount: s.amount,
        fromName: s.user_name,
        toName: exp.paid_by_name,
      }))
  );
  const simplifiedDebts = simplifyDebts(debtEdges);

  if (selectedGroup && selectedGroupData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        {/* Group Detail Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md }}>
          <TouchableOpacity onPress={() => setSelectedGroup(null)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{selectedGroupData.name}</Text>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>
              {selectedGroupData.members?.length || 0} members • {groupExpenses.length} expenses
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 100 }}>
          {/* Members */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Members</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {selectedGroupData.members?.map(m => (
                <View key={m.id} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: colors.primaryBg, borderRadius: BorderRadius.full,
                  paddingHorizontal: Spacing.md, paddingVertical: 6,
                }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.bold, color: '#FFF' }}>{m.user_name?.[0] || '?'}</Text>
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{m.user_name}</Text>
                  {m.role === 'admin' && <MaterialCommunityIcons name="crown" size={12} color={colors.accent} />}
                </View>
              ))}
            </View>
          </Card>

          {/* Simplified Debts */}
          {simplifiedDebts.length > 0 && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Who Owes Whom</Text>
              {simplifiedDebts.map((debt, i) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: Spacing.sm, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderLight,
                }}>
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

          {/* Expenses */}
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Expenses</Text>
          {groupExpenses.map(exp => (
            <Card key={exp.id} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <View>
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{exp.description}</Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>Paid by {exp.paid_by_name} • {formatRelativeDate(exp.created_at)}</Text>
                </View>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(exp.amount)}</Text>
              </View>
              {exp.splits?.map(split => (
                <View key={split.id} style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.borderLight,
                }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{split.user_name} owes</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{formatCurrency(split.amount)}</Text>
                    <TouchableOpacity
                      onPress={() => !split.is_settled && settleExpense(split.id)}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
                        backgroundColor: split.is_settled ? colors.primaryBg : colors.emergencyBg,
                      }}
                    >
                      <Text style={{
                        fontSize: 10, fontFamily: Typography.fontFamily.semiBold,
                        color: split.is_settled ? colors.primary : colors.emergency,
                      }}>{split.is_settled ? 'Settled' : 'Pending'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>Groups</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Split expenses with friends and flatmates</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 100 }}>
        {groups.map(group => {
          const color = GROUP_TYPE_COLORS[group.type] || colors.primary;
          const icon = GROUP_TYPE_ICONS[group.type] || 'account-group';
          return (
            <TouchableOpacity key={group.id} onPress={() => setSelectedGroup(group.id)} activeOpacity={0.7}>
              <Card style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: BorderRadius.md,
                    backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MaterialCommunityIcons name={icon as any} size={24} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{group.name}</Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>
                      {group.members?.length || 0} members • {formatRelativeDate(group.created_at)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(group.total_expenses || 0)}</Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>total</Text>
                  </View>
                </View>
                {/* Member avatars */}
                <View style={{ flexDirection: 'row', marginTop: Spacing.md, gap: -8 }}>
                  {group.members?.slice(0, 4).map((m, i) => (
                    <View key={m.id} style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: [colors.primary, colors.accent, '#8B5CF6', '#3B82F6'][i % 4],
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2, borderColor: colors.card,
                      marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
                    }}>
                      <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.bold, color: '#FFF' }}>{m.user_name?.[0]}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        {groups.length === 0 && (
          <EmptyState icon="account-group-outline" title="No Groups Yet" message="Create a group to start splitting expenses." />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowCreateModal(true)}
        style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
          ...Shadows.lg, shadowColor: colors.primary,
        }}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>Create Group</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Group Name" placeholder="e.g., Flat 302" value={newGroupName} onChangeText={setNewGroupName} icon="account-group-outline" />
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.sm }}>Group Type</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
              {(['flatmates', 'friends', 'trip', 'event'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewGroupType(type)}
                  style={{
                    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.md,
                    backgroundColor: newGroupType === type ? `${GROUP_TYPE_COLORS[type]}15` : colors.surface,
                    borderWidth: 1.5, borderColor: newGroupType === type ? GROUP_TYPE_COLORS[type] : colors.border,
                  }}
                >
                  <MaterialCommunityIcons name={GROUP_TYPE_ICONS[type] as any} size={22} color={newGroupType === type ? GROUP_TYPE_COLORS[type] : colors.textTertiary} />
                  <Text style={{
                    fontSize: 10, fontFamily: Typography.fontFamily.medium, marginTop: 4, textTransform: 'capitalize',
                    color: newGroupType === type ? GROUP_TYPE_COLORS[type] : colors.textSecondary,
                  }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Create Group" onPress={handleCreateGroup} fullWidth size="lg" icon="check" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
