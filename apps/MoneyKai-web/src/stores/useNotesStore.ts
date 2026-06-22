import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, ChecklistItem } from '../types/note';
import { recordAppNotification } from '@/services/notificationService';
import { useAuthStore } from './useAuthStore';
import { deleteUserDoc, upsertUserDoc } from '@/services/firestoreData';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';

const syncNoteCreate = (note: Note) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserDoc('notes', userId, note).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync note create:', error);
    }
  });
};

const syncNoteUpdate = (id: string, updates: Partial<Note>) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserDoc('notes', userId, { id, ...updates } as Note).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync note update:', error);
    }
  });
};

const syncNoteDelete = (id: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void deleteUserDoc('notes', userId, id).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync note delete:', error);
    }
  });
};

interface NotesState {
  notes: Note[];
  isSeeded: boolean;

  // Getters
  getPinnedNotes: () => Note[];
  getRecentNotes: (count?: number) => Note[];

  // Actions
  addNote: (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId?: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  toggleChecklistItem: (noteId: string, itemId: string) => void;
  addChecklistItem: (noteId: string, text: string) => void;
  /** Removes seeded sample notes and resets isSeeded. Call on sign-out. */
  clearSeedData: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => {
      let cachedPinned: Note[] = [];
      let lastTxnsForPinned: Note[] = [];

      let cachedRecent: Note[] = [];
      let lastTxnsForRecent: Note[] = [];
      let lastCountForRecent: number = 0;

      return {
        notes: [],
        isSeeded: false,

        getPinnedNotes: () => {
          const notes = get().notes;
          if (notes === lastTxnsForPinned) return cachedPinned;
          const result = notes.filter(n => n.is_pinned);
          lastTxnsForPinned = notes;
          cachedPinned = result;
          return result;
        },
        getRecentNotes: (count = 5) => {
          const notes = get().notes;
          if (notes === lastTxnsForRecent && count === lastCountForRecent) {
            return cachedRecent;
          }
          const result = [...notes]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, count);
          lastTxnsForRecent = notes;
          lastCountForRecent = count;
          cachedRecent = result;
          return result;
        },

        addNote: (note, userId = useAuthStore.getState().user?.id ?? 'local') => {
          const now = new Date().toISOString();
          const newNote: Note = {
            ...note,
            id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            user_id: userId,
            created_at: now,
            updated_at: now,
          };
          set((state) => ({ notes: [newNote, ...state.notes] }));
          syncNoteCreate(newNote);
          queueAutomaticBackup('note added');
          void recordAppNotification({
            title: 'Note saved',
            body: newNote.title,
            type: 'system',
            actionRoute: '/notes',
          });
        },

        updateNote: (id, updates) => {
          const next = { ...updates, updated_at: new Date().toISOString() };
          set((state) => ({
            notes: state.notes.map(n =>
              n.id === id ? { ...n, ...next } : n
            ),
          }));
          syncNoteUpdate(id, next);
          queueAutomaticBackup('note updated');
        },

        deleteNote: (id) => {
          set((state) => ({
            notes: state.notes.filter(n => n.id !== id),
          }));
          syncNoteDelete(id);
          queueAutomaticBackup('note deleted');
        },

        togglePin: (id) => {
          const note = get().notes.find((item) => item.id === id);
          if (!note) return;
          const next = { is_pinned: !note.is_pinned, updated_at: new Date().toISOString() };
          set((state) => ({
            notes: state.notes.map(n =>
              n.id === id ? { ...n, ...next } : n
            ),
          }));
          syncNoteUpdate(id, next);
          queueAutomaticBackup('note updated');
        },

        toggleChecklistItem: (noteId, itemId) => {
          const note = get().notes.find((item) => item.id === noteId);
          if (!note?.checklist_items) return;
          const nextChecklistItems = note.checklist_items.map((item: ChecklistItem) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          const next = { checklist_items: nextChecklistItems, updated_at: new Date().toISOString() };
          set((state) => ({
            notes: state.notes.map(n =>
              n.id === noteId ? { ...n, ...next } : n
            ),
          }));
          syncNoteUpdate(noteId, next);
          queueAutomaticBackup('note updated');
        },

        addChecklistItem: (noteId, text) => {
          const note = get().notes.find((item) => item.id === noteId);
          if (!note) return;
          const nextChecklistItems = [
            ...(note.checklist_items || []),
            { id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, completed: false },
          ];
          const next = { checklist_items: nextChecklistItems, updated_at: new Date().toISOString() };
          set((state) => ({
            notes: state.notes.map(n =>
              n.id === noteId ? { ...n, ...next } : n
            ),
          }));
          syncNoteUpdate(noteId, next);
        },

        clearSeedData: () =>
          set((state) => ({
            notes: state.notes.filter((n) => n.user_id !== 'sample'),
            isSeeded: false,
          })),
      };
    },
    {
      name: 'moneykai-notes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
