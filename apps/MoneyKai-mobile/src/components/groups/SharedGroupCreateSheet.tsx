import React, { useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Group } from '@/types/group';
import { createClientMutationId } from '@/utils/groupExpense';

interface SharedGroupCreateSheetProps {
  visible: boolean;
  currentUser: { id: string; name: string };
  onClose: () => void;
  onCreate: (group: Omit<Group, 'id' | 'created_at'>) => void | Promise<Group>;
}

type FormErrors = { name?: string; participants?: string; submit?: string };

export function SharedGroupCreateSheet({ visible, currentUser, onClose, onCreate }: SharedGroupCreateSheetProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [participantNames, setParticipantNames] = useState(['', '']);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [mutationId, setMutationId] = useState(() => createClientMutationId('group'));
  const namedParticipants = useMemo(
    () => participantNames.map((item) => item.trim()).filter(Boolean),
    [participantNames],
  );

  const updateParticipant = (index: number, value: string) => {
    setParticipantNames((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
    setErrors((current) => ({ ...current, participants: undefined, submit: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Enter a group name.';
    const partiallyBlank = participantNames.some((item) => !item.trim()) && participantNames.some((item) => item.trim());
    if (partiallyBlank) next.participants = 'Remove blank participant rows or enter a name.';
    const normalized = namedParticipants.map((item) => item.toLocaleLowerCase());
    if (new Set(normalized).size !== normalized.length) next.participants = 'Each participant name must be unique.';
    if (normalized.includes(currentUser.name.trim().toLocaleLowerCase())) next.participants = `${currentUser.name} is already included as you.`;
    return next;
  };

  const handleCreate = async () => {
    if (saving) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const joinedAt = new Date().toISOString();
    const members = [currentUser.name, ...namedParticipants].map((userName, index) => ({
      id: `member_${mutationId}_${index}`,
      group_id: '',
      user_id: index === 0 ? currentUser.id : `ledger_${mutationId}_${index}`,
      role: index === 0 ? ('admin' as const) : ('member' as const),
      joined_at: joinedAt,
      user_name: userName,
    }));

    setSaving(true);
    try {
      await onCreate({
        created_by: currentUser.id,
        name: name.trim(),
        type: 'friends',
        description: 'Shared expenses',
        archived: false,
        members,
        mutation_id: mutationId,
      });
      setName('');
      setParticipantNames(['', '']);
      setErrors({});
      setMutationId(createClientMutationId('group'));
      onClose();
    } catch (error) {
      setErrors((current) => ({ ...current, submit: error instanceof Error ? error.message : 'Could not synchronize this group. Retry safely.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      title="Create group"
      subtitle="Start a private ledger for expenses you confirm."
      onClose={() => { if (!saving) onClose(); }}
      footer={(
        <View style={{ gap: Spacing.sm }}>
          {errors.submit ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.xs }}>{errors.submit}</Text> : null}
          <Button title={errors.submit ? 'Retry creating group' : 'Create group'} icon="arrow-right" onPress={handleCreate} loading={saving} fullWidth />
        </View>
      )}
    >
      <Input label="Group name" value={name} onChangeText={(value) => { setName(value); setErrors((current) => ({ ...current, name: undefined, submit: undefined })); }} placeholder="Group name" icon="account-group-outline" error={errors.name} maxLength={60} />

      <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginBottom: Spacing.sm }}>People in this ledger</Text>
      {participantNames.map((participant, index) => (
        <View key={`participant-${index}`} style={{ alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input label={`Person ${index + 1}`} value={participant} onChangeText={(value) => updateParticipant(index, value)} placeholder="Person's name" icon="account-outline" maxLength={80} />
          </View>
          {participantNames.length > 1 ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${participant.trim() || `person ${index + 1}`}`} onPress={() => setParticipantNames((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={{ alignItems: 'center', borderColor: colors.border, borderRadius: BorderRadius.full, borderWidth: 1, height: 44, justifyContent: 'center', marginTop: 23, width: 44 }}>
              <MaterialCommunityIcons name="minus" color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      {errors.participants ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.xs, marginBottom: Spacing.sm }}>{errors.participants}</Text> : null}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add another person" onPress={() => setParticipantNames((current) => [...current, ''])} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, minHeight: 44 }}>
        <MaterialCommunityIcons name="plus" color={colors.primaryDark} size={18} />
        <Text style={{ color: colors.primaryDark, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>Add another person</Text>
      </TouchableOpacity>

      <View style={{ backgroundColor: colors.primaryBg, borderRadius: BorderRadius.sm, marginBottom: Spacing.base, marginTop: Spacing.sm, padding: Spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: Typography.fontSize.xs, lineHeight: 18 }}>Names are used for this ledger. No invitation is sent.</Text>
      </View>
    </ModalSheet>
  );
}
