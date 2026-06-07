import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useNotesStore } from '../../stores/useNotesStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
}

type NoteType = 'note' | 'checklist';

export const NoteModal: React.FC<NoteModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const addNote = useNotesStore((s) => s.addNote);
  const userId = useAuthStore((s) => s.user?.id ?? 'local');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [titleError, setTitleError] = useState('');

  const reset = () => {
    setTitle('');
    setContent('');
    setNoteType('note');
    setTitleError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    const checklistItems = noteType === 'checklist'
      ? content
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text, index) => ({
          id: `cl_${Date.now()}_${index}`,
          text,
          completed: false,
        }))
      : undefined;

    addNote(
      {
        title: title.trim(),
        content: noteType === 'checklist'
          ? checklistItems?.map((item) => item.text).join(', ') ?? ''
          : content.trim(),
        type: noteType,
        is_pinned: false,
        checklist_items: checklistItems,
      },
      userId
    );
    handleClose();
  };

  const typeOptions: { value: NoteType; label: string; icon: string }[] = [
    { value: 'note', label: 'Note', icon: 'note-text-outline' },
    { value: 'checklist', label: 'Checklist', icon: 'checkbox-marked-outline' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: BorderRadius.xl,
            borderTopRightRadius: BorderRadius.xl,
            padding: Spacing.xl,
            paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
            <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              New Note
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Type selector */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {typeOptions.map((opt) => {
              const active = noteType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setNoteType(opt.value)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={16}
                    color={active ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.medium,
                    color: active ? colors.textInverse : colors.textSecondary,
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary, marginBottom: 6 }}>
              Title <Text style={{ color: colors.emergency }}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={(t) => { setTitle(t); if (titleError) setTitleError(''); }}
              placeholder="Note title..."
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.surface,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                borderColor: titleError ? colors.emergency : colors.border,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                fontSize: Typography.fontSize.base,
                color: colors.textPrimary,
                fontFamily: Typography.fontFamily.regular,
                marginBottom: titleError ? 4 : Spacing.lg,
              }}
            />
            {!!titleError && (
              <Text style={{ color: colors.emergency, fontSize: Typography.fontSize.xs, marginBottom: Spacing.sm }}>
                {titleError}
              </Text>
            )}

            {/* Content */}
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary, marginBottom: 6 }}>
              {noteType === 'checklist' ? 'Items (one per line)' : 'Content'}
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={noteType === 'checklist' ? 'Buy milk\nCall dentist\n...' : 'Write your note here...'}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.surface,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                fontSize: Typography.fontSize.base,
                color: colors.textPrimary,
                fontFamily: Typography.fontFamily.regular,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: Spacing.xl,
              }}
            />
          </ScrollView>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
                borderWidth: 1, borderColor: colors.border, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={{
                flex: 2, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
                backgroundColor: colors.primary, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                Save Note
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default NoteModal;
