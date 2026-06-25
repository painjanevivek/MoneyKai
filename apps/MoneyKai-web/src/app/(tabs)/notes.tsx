import React, { useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNotesStore } from '@/stores/useNotesStore';
import { NoteModal } from '@/components/dashboard/NoteModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeDate } from '@/utils/dateUtils';
import { confirmDestructive } from '@/utils/confirmDestructive';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { Note } from '@/types/note';

export default function NotesScreen() {
  const { colors, isDark } = useTheme();
  const notes = useNotesStore((s) => s.notes);
  const noteSyncErrors = useNotesStore((s) => s.noteSyncErrors);
  const pendingNoteIds = useNotesStore((s) => s.pendingNoteIds);
  const { deleteNote, dismissNoteSyncError, retryNoteSync, togglePin } = useNotesStore();
  const [showModal, setShowModal] = useState(false);
  const syncErrorEntries = Object.entries(noteSyncErrors);

  const sorted = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const handleDelete = (note: Note) => {
    confirmDestructive({
      title: 'Delete Note',
      message: `Delete "${note.title}"? This cannot be undone.`,
      onConfirm: () => deleteNote(note.id),
    });
  };

  const typeIcon = (type: Note['type']) => {
    if (type === 'checklist') return 'checkbox-marked-outline';
    if (type === 'ledger') return 'book-outline';
    return 'note-text-outline';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <View>
          <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            Quick Notes
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
            {sorted.length} note{sorted.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark ? colors.surface : colors.primary,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons name="plus" size={18} color={isDark ? colors.textPrimary : colors.textInverse} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: isDark ? colors.textPrimary : colors.textInverse }}>New Note</Text>
        </TouchableOpacity>
      </View>

      {sorted.length === 0 ? (
        <EmptyState icon="note-text-outline" title="No notes yet" message="Tap + New Note to jot something down." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={true}>
          {syncErrorEntries.length > 0 ? (
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
              {syncErrorEntries.map(([noteId, error]) => (
                <View
                  key={noteId}
                  accessibilityRole="alert"
                  style={{
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.error,
                    backgroundColor: colors.emergencyBg,
                    padding: Spacing.md,
                    gap: Spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons name="cloud-alert-outline" size={18} color={colors.error} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        Sync failed for {error.title}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                        {error.message}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                    <TouchableOpacity
                      onPress={() => void retryNoteSync(noteId)}
                      disabled={pendingNoteIds.includes(noteId)}
                      accessibilityRole="button"
                      accessibilityState={{ busy: pendingNoteIds.includes(noteId), disabled: pendingNoteIds.includes(noteId) }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: BorderRadius.sm,
                        backgroundColor: colors.primary,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        opacity: pendingNoteIds.includes(noteId) ? 0.6 : 1,
                      }}
                    >
                      {pendingNoteIds.includes(noteId) ? (
                        <ActivityIndicator size="small" color={colors.textInverse} />
                      ) : (
                        <MaterialCommunityIcons name="refresh" size={15} color={colors.textInverse} />
                      )}
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                        Retry
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => dismissNoteSyncError(noteId)}
                      accessibilityRole="button"
                      style={{
                        borderRadius: BorderRadius.sm,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        Dismiss
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {sorted.map((note) => (
            <View
              key={note.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: BorderRadius.lg,
                padding: Spacing.base,
                marginBottom: Spacing.md,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
                borderWidth: 1,
                borderColor: pendingNoteIds.includes(note.id)
                  ? colors.primary
                  : note.is_pinned
                    ? colors.textSecondary
                    : colors.borderLight,
                opacity: pendingNoteIds.includes(note.id) ? 0.82 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={typeIcon(note.type) as any} size={18} color={colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {note.title}
                    </Text>
                  </View>
                  {!!note.content && (
                    <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>
                      {note.content}
                    </Text>
                  )}
                  {note.type === 'checklist' && note.checklist_items && (
                    <View style={{ marginTop: 4, gap: 2 }}>
                      {note.checklist_items.slice(0, 3).map((item) => (
                        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons
                            name={item.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                            size={14}
                            color={item.completed ? colors.primary : colors.textTertiary}
                          />
                          <Text style={{ fontSize: Typography.fontSize.xs, color: item.completed ? colors.textTertiary : colors.textSecondary, textDecorationLine: item.completed ? 'line-through' : 'none' }}>
                            {item.text}
                          </Text>
                        </View>
                      ))}
                      {note.checklist_items.length > 3 && (
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: 2 }}>
                          +{note.checklist_items.length - 3} more...
                        </Text>
                      )}
                    </View>
                  )}
                  <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 8 }}>
                    {pendingNoteIds.includes(note.id) ? 'Syncing...' : formatRelativeDate(note.updated_at)}
                  </Text>
                </View>

                <View style={{ gap: Spacing.sm, alignItems: 'center', marginLeft: Spacing.xs }}>
                  {pendingNoteIds.includes(note.id) ? (
                    <View
                      accessibilityLabel={`Syncing ${note.title}`}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => togglePin(note.id)}
                    disabled={pendingNoteIds.includes(note.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={note.is_pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
                    accessibilityState={{ disabled: pendingNoteIds.includes(note.id) }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={note.is_pinned ? 'pin' : 'pin-outline'}
                      size={18}
                      color={note.is_pinned ? colors.primary : colors.textTertiary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(note)}
                    disabled={pendingNoteIds.includes(note.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${note.title}`}
                    accessibilityState={{ disabled: pendingNoteIds.includes(note.id) }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <NoteModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}
