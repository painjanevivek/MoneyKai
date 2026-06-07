import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, ChecklistItem } from '../types/note';
import { recordAppNotification } from '@/services/notificationService';
import { isFirebaseConfigured } from '@/services/firebase';
import { backendApi, isBackendConfigured } from '@/services/backendApi';
import { useAuthStore } from './useAuthStore';

const syncNoteCreate = (note: Note) => {
  if (!isBackendConfigured()) {
    return;
  }
  void backendApi.createResource<Note>('notes', note).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync note create:', error);
    }
  });
};

const syncNoteUpdate = (id: string, updates: Partial<Note>) => {
  if (!isBackendConfigured()) {
    return;
  }
  void backendApi.updateResource<Note>('notes', id, updates).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync note update:', error);
    }
  });
};

const syncNoteDelete = (id: string) => {
  if (!isBackendConfigured()) {
    return;
  }
  void backendApi.deleteResource('notes', id).catch((error) => {
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

const SAMPLE_NOTES: Note[] = [
  {
    id: 'note1',
    user_id: 'sample',
    title: 'Monthly Budget Plan',
    content: 'Plan for the month of May. Focus on saving more and avoid unnecessary expenses.',
    is_pinned: true,
    type: 'note',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'note2',
    user_id: 'sample',
    title: 'Grocery List',
    content: 'Milk, Bread, Eggs, Rice, Dal',
    is_pinned: false,
    type: 'checklist',
    checklist_items: [
      { id: 'cl1', text: 'Milk', completed: true },
      { id: 'cl2', text: 'Bread', completed: true },
      { id: 'cl3', text: 'Eggs', completed: false },
      { id: 'cl4', text: 'Rice', completed: false },
      { id: 'cl5', text: 'Dal', completed: false },
    ],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

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
          void recordAppNotification({
            title: 'Note saved',
            body: newNote.title,
            type: 'system',
            actionRoute: '/(tabs)/notes',
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
        },

        deleteNote: (id) => {
          set((state) => ({
            notes: state.notes.filter(n => n.id !== id),
          }));
          syncNoteDelete(id);
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
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (isFirebaseConfigured()) {
          state.notes = state.notes.filter((note) => note.user_id !== 'sample');
          return;
        }
        if (!state.isSeeded) {
          state.notes = SAMPLE_NOTES;
          state.isSeeded = true;
        }
      },
    }
  )
);

