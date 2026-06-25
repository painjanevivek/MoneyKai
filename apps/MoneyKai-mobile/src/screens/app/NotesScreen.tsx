import React, { useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { createAppScreenStyles, formatDate } from './screenStyles';
import type { Note } from '@/types/note';

export function NotesScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const userId = useAuthStore((state) => state.user?.id);
  const notes = useNotesStore((state) => state.notes);
  const addNote = useNotesStore((state) => state.addNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const togglePin = useNotesStore((state) => state.togglePin);
  const pendingNoteIds = useNotesStore((state) => state.pendingOptimisticNoteIds);
  const optimisticError = useNotesStore((state) => state.optimisticError);
  const retryLastOptimisticNoteAction = useNotesStore((state) => state.retryLastOptimisticNoteAction);
  const clearOptimisticError = useNotesStore((state) => state.clearOptimisticError);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const saveNote = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Note needs content', 'Add a title and note body.');
      return;
    }

    addNote(
      {
        title: title.trim(),
        content: content.trim(),
        is_pinned: false,
        type: 'note',
      },
      userId
    );
    setTitle('');
    setContent('');
  };

  const renderNote = React.useCallback(
    ({ item: note }: { item: Note }) => {
      const isPending = pendingNoteIds.includes(note.id);

      return (
      <View style={[styles.panel, isPending ? { opacity: 0.74, borderColor: colors.primary } : null]}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={styles.value} numberOfLines={1}>{note.title}</Text>
            <Text style={styles.muted}>{isPending ? 'Saving...' : formatDate(note.updated_at)}</Text>
          </View>
          <TouchableOpacity disabled={isPending} onPress={() => togglePin(note.id)} style={{ padding: Spacing.sm }}>
            <MaterialCommunityIcons
              name={note.is_pinned ? 'pin' : 'pin-outline'}
              size={22}
              color={note.is_pinned ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity disabled={isPending} onPress={() => deleteNote(note.id)} style={{ padding: Spacing.sm }}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={{ ...styles.muted, marginTop: Spacing.sm }}>{note.content}</Text>
      </View>
    );
    },
    [colors.error, colors.primary, colors.textSecondary, deleteNote, pendingNoteIds, styles, togglePin]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <FlatList
        data={notes}
        keyExtractor={(note) => note.id}
        renderItem={renderNote}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <ScreenBackButton />
              <Text style={styles.title}>Money notes</Text>
              <Text style={styles.subtitle}>Keep plans, reminders, and decisions synced with your account.</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>New note</Text>
              <Input label="Title" value={title} onChangeText={setTitle} placeholder="Rent plan, grocery list..." icon="format-title" />
              <Input
                label="Content"
                value={content}
                onChangeText={setContent}
                placeholder="Write the useful bit here"
                icon="note-text-outline"
                multiline
                numberOfLines={4}
              />
              <Button title="Save note" onPress={saveNote} />
            </View>
            {optimisticError ? (
              <View style={[styles.panel, { borderColor: colors.error }]}>
                <Text style={styles.value}>Cloud save needs attention</Text>
                <Text style={{ ...styles.muted, marginTop: Spacing.xs }}>{optimisticError}</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                  {retryLastOptimisticNoteAction ? (
                    <Button
                      title="Retry"
                      icon="refresh"
                      onPress={retryLastOptimisticNoteAction}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                  <Button
                    title="Dismiss"
                    variant="outline"
                    onPress={clearOptimisticError}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No notes yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
