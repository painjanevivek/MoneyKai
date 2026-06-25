import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, ChecklistItem } from '../types/note';
import { recordAppNotification } from '@/services/notificationService';
import { useAuthStore } from './useAuthStore';
import { deleteUserDoc, upsertUserDoc } from '@/services/firestoreData';
import { requestAutomaticBackup } from '@/services/backupService';
import { isFirebaseConfigured } from '@/services/firebase';
import { runOptimisticMutation } from '@/services/optimisticMutation';

const syncNoteCreate = async (note: Note) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  await upsertUserDoc('notes', userId, note);
};

const syncNoteUpdate = async (id: string, updates: Partial<Note>) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  await upsertUserDoc('notes', userId, { id, ...updates } as Note);
};

const syncNoteDelete = async (id: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  await deleteUserDoc('notes', userId, id);
};

const formatOptimisticNoteError = (action: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'The cloud save did not finish.';
  return `${action} was rolled back. ${message}`;
};

interface NotesState {
  notes: Note[];
  isSeeded: boolean;
  pendingOptimisticNoteIds: string[];
  optimisticError: string | null;

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
  retryLastOptimisticNoteAction: (() => void) | null;
  clearOptimisticError: () => void;
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
        notes: isFirebaseConfigured() ? [] : SAMPLE_NOTES,
        isSeeded: false,
        pendingOptimisticNoteIds: [],
        optimisticError: null,
        retryLastOptimisticNoteAction: null,

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
          void runOptimisticMutation<Note[]>({
            mutationId: `note:create:${newNote.id}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: [newNote, ...state.notes],
                pendingOptimisticNoteIds: [...new Set([...state.pendingOptimisticNoteIds, newNote.id])],
                optimisticError: null,
                retryLastOptimisticNoteAction: null,
              })),
            commit: () => syncNoteCreate(newNote),
            rollback: (previousNotes) =>
              set((state) => ({
                notes: previousNotes,
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== newNote.id),
              })),
            reconcile: () => {
              set((state) => ({
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== newNote.id),
              }));
              void recordAppNotification({
                title: 'Note saved',
                body: newNote.title,
                type: 'system',
                actionRoute: '/(tabs)/notes',
              });
              void requestAutomaticBackup('note added');
            },
            onError: ({ error, retry }) => {
              if (__DEV__) {
                console.warn('[MoneyKai] failed to sync note create:', error);
              }
              set({
                optimisticError: formatOptimisticNoteError('Note save', error),
                retryLastOptimisticNoteAction: () => {
                  void retry();
                },
              });
              void recordAppNotification({
                title: 'Note save rolled back',
                body: 'MoneyKai could not confirm the note in the cloud. Review and retry when connected.',
                type: 'system',
                actionRoute: '/Notes',
                schedule: false,
              });
            },
          });
        },

        updateNote: (id, updates) => {
          const next = { ...updates, updated_at: new Date().toISOString() };
          void runOptimisticMutation<Note[]>({
            mutationId: `note:update:${id}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.map(n =>
                  n.id === id ? { ...n, ...next } : n
                ),
                pendingOptimisticNoteIds: [...new Set([...state.pendingOptimisticNoteIds, id])],
                optimisticError: null,
                retryLastOptimisticNoteAction: null,
              })),
            commit: () => syncNoteUpdate(id, next),
            rollback: (previousNotes) =>
              set((state) => ({
                notes: previousNotes,
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== id),
              })),
            reconcile: () => {
              set((state) => ({
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== id),
              }));
              void requestAutomaticBackup('note updated');
            },
            onError: ({ error, retry }) => {
              if (__DEV__) {
                console.warn('[MoneyKai] failed to sync note update:', error);
              }
              set({
                optimisticError: formatOptimisticNoteError('Note update', error),
                retryLastOptimisticNoteAction: () => {
                  void retry();
                },
              });
            },
          });
        },

        deleteNote: (id) => {
          void runOptimisticMutation<Note[]>({
            mutationId: `note:delete:${id}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.filter(n => n.id !== id),
                pendingOptimisticNoteIds: [...new Set([...state.pendingOptimisticNoteIds, id])],
                optimisticError: null,
                retryLastOptimisticNoteAction: null,
              })),
            commit: () => syncNoteDelete(id),
            rollback: (previousNotes) =>
              set((state) => ({
                notes: previousNotes,
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== id),
              })),
            reconcile: () => {
              set((state) => ({
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== id),
              }));
              void requestAutomaticBackup('note deleted');
            },
            onError: ({ error, retry }) => {
              if (__DEV__) {
                console.warn('[MoneyKai] failed to sync note delete:', error);
              }
              set({
                optimisticError: formatOptimisticNoteError('Note delete', error),
                retryLastOptimisticNoteAction: () => {
                  void retry();
                },
              });
            },
          });
        },

        togglePin: (id) => {
          const note = get().notes.find((item) => item.id === id);
          if (!note) return;
          const next = { is_pinned: !note.is_pinned, updated_at: new Date().toISOString() };
          void runOptimisticMutation<Note[]>({
            mutationId: `note:update:${id}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.map(n =>
                  n.id === id ? { ...n, ...next } : n
                ),
                pendingOptimisticNoteIds: [...new Set([...state.pendingOptimisticNoteIds, id])],
                optimisticError: null,
                retryLastOptimisticNoteAction: null,
              })),
            commit: () => syncNoteUpdate(id, next),
            rollback: (previousNotes) =>
              set((state) => ({
                notes: previousNotes,
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== id),
              })),
            reconcile: () => {
              set((state) => ({
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== id),
              }));
              void requestAutomaticBackup('note updated');
            },
            onError: ({ error, retry }) => {
              if (__DEV__) {
                console.warn('[MoneyKai] failed to sync note pin:', error);
              }
              set({
                optimisticError: formatOptimisticNoteError('Pin change', error),
                retryLastOptimisticNoteAction: () => {
                  void retry();
                },
              });
            },
          });
        },

        toggleChecklistItem: (noteId, itemId) => {
          const note = get().notes.find((item) => item.id === noteId);
          if (!note?.checklist_items) return;
          const nextChecklistItems = note.checklist_items.map((item: ChecklistItem) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          const next = { checklist_items: nextChecklistItems, updated_at: new Date().toISOString() };
          void runOptimisticMutation<Note[]>({
            mutationId: `note:update:${noteId}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.map(n =>
                  n.id === noteId ? { ...n, ...next } : n
                ),
                pendingOptimisticNoteIds: [...new Set([...state.pendingOptimisticNoteIds, noteId])],
                optimisticError: null,
                retryLastOptimisticNoteAction: null,
              })),
            commit: () => syncNoteUpdate(noteId, next),
            rollback: (previousNotes) =>
              set((state) => ({
                notes: previousNotes,
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== noteId),
              })),
            reconcile: () => {
              set((state) => ({
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== noteId),
              }));
              void requestAutomaticBackup('note updated');
            },
            onError: ({ error, retry }) => {
              if (__DEV__) {
                console.warn('[MoneyKai] failed to sync checklist item:', error);
              }
              set({
                optimisticError: formatOptimisticNoteError('Checklist change', error),
                retryLastOptimisticNoteAction: () => {
                  void retry();
                },
              });
            },
          });
        },

        addChecklistItem: (noteId, text) => {
          const note = get().notes.find((item) => item.id === noteId);
          if (!note) return;
          const nextChecklistItems = [
            ...(note.checklist_items || []),
            { id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, completed: false },
          ];
          const next = { checklist_items: nextChecklistItems, updated_at: new Date().toISOString() };
          void runOptimisticMutation<Note[]>({
            mutationId: `note:update:${noteId}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.map(n =>
                  n.id === noteId ? { ...n, ...next } : n
                ),
                pendingOptimisticNoteIds: [...new Set([...state.pendingOptimisticNoteIds, noteId])],
                optimisticError: null,
                retryLastOptimisticNoteAction: null,
              })),
            commit: () => syncNoteUpdate(noteId, next),
            rollback: (previousNotes) =>
              set((state) => ({
                notes: previousNotes,
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== noteId),
              })),
            reconcile: () => {
              set((state) => ({
                pendingOptimisticNoteIds: state.pendingOptimisticNoteIds.filter((item) => item !== noteId),
              }));
              void requestAutomaticBackup('note updated');
            },
            onError: ({ error, retry }) => {
              if (__DEV__) {
                console.warn('[MoneyKai] failed to sync checklist add:', error);
              }
              set({
                optimisticError: formatOptimisticNoteError('Checklist item', error),
                retryLastOptimisticNoteAction: () => {
                  void retry();
                },
              });
            },
          });
        },

        clearOptimisticError: () =>
          set({
            optimisticError: null,
            retryLastOptimisticNoteAction: null,
          }),

        clearSeedData: () =>
          set((state) => ({
            notes: state.notes.filter((n) => n.user_id !== 'sample'),
            isSeeded: false,
            pendingOptimisticNoteIds: [],
            optimisticError: null,
            retryLastOptimisticNoteAction: null,
          })),
      };
    },
    {
      name: 'moneykai-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notes: state.notes,
        isSeeded: state.isSeeded,
      }),
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

