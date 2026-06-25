import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, ChecklistItem } from '../types/note';
import { recordAppNotification } from '@/services/notificationService';
import { useAuthStore } from './useAuthStore';
import { deleteUserDoc, upsertUserDoc } from '@/services/firestoreData';
import { isFirebaseConfigured } from '@/services/firebase';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';
import { getOptimisticErrorMessage, runOptimisticMutation } from '@/services/optimisticMutation';

type NoteSyncAction = 'create' | 'delete' | 'update';

type NoteSyncError = {
  action: NoteSyncAction;
  message: string;
  title: string;
};

const noteOperationVersions = new Map<string, number>();

const getNextNoteOperationVersion = (noteId: string) => {
  const next = (noteOperationVersions.get(noteId) ?? 0) + 1;
  noteOperationVersions.set(noteId, next);
  return next;
};

const syncNoteCreate = async (note: Note) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || !isFirebaseConfigured()) return;
  await upsertUserDoc('notes', userId, note);
};

const syncNoteUpdate = async (id: string, updates: Partial<Note>) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || !isFirebaseConfigured()) return;
  await upsertUserDoc('notes', userId, { id, ...updates } as Note);
};

const syncNoteDelete = async (id: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || !isFirebaseConfigured()) return;
  await deleteUserDoc('notes', userId, id);
};

interface NotesState {
  notes: Note[];
  isSeeded: boolean;
  noteSyncErrors: Record<string, NoteSyncError>;
  pendingNoteIds: string[];

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
  dismissNoteSyncError: (id: string) => void;
  retryNoteSync: (id: string) => Promise<void>;
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
        noteSyncErrors: {},
        pendingNoteIds: [],

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
          const operationVersion = getNextNoteOperationVersion(newNote.id);
          set((state) => ({
            noteSyncErrors: withoutKey(state.noteSyncErrors, newNote.id),
            pendingNoteIds: addPendingId(state.pendingNoteIds, newNote.id),
          }));
          void runOptimisticMutation<Note[], void>({
            mutationId: `note:create:${newNote.id}`,
            snapshot: () => get().notes,
            apply: () => set((state) => ({ notes: [newNote, ...state.notes] })),
            commit: () => syncNoteCreate(newNote),
            rollback: (previousNotes) => {
              if (noteOperationVersions.get(newNote.id) === operationVersion) {
                set({ notes: previousNotes });
              }
            },
            reconcile: () => {
              if (noteOperationVersions.get(newNote.id) !== operationVersion) return;
              queueAutomaticBackup('note added');
              void recordAppNotification({
                title: 'Note saved',
                body: newNote.title,
                type: 'system',
                actionRoute: '/notes',
              });
            },
            onError: ({ error }) => {
              if (noteOperationVersions.get(newNote.id) !== operationVersion) return;
              set((state) => ({
                noteSyncErrors: {
                  ...state.noteSyncErrors,
                  [newNote.id]: {
                    action: 'create',
                    message: getOptimisticErrorMessage(error, 'MoneyKai could not save this note. It was removed from your list.'),
                    title: newNote.title,
                  },
                },
              }));
            },
          }).finally(() => {
            if (noteOperationVersions.get(newNote.id) === operationVersion) {
              set((state) => ({ pendingNoteIds: removePendingId(state.pendingNoteIds, newNote.id) }));
            }
          });
        },

        updateNote: (id, updates) => {
          if (get().pendingNoteIds.includes(id)) return;
          const next = { ...updates, updated_at: new Date().toISOString() };
          const note = get().notes.find((item) => item.id === id);
          if (!note) return;
          const operationVersion = getNextNoteOperationVersion(id);
          set((state) => ({
            noteSyncErrors: withoutKey(state.noteSyncErrors, id),
            pendingNoteIds: addPendingId(state.pendingNoteIds, id),
          }));
          void runOptimisticMutation<Note[], void>({
            mutationId: `note:update:${id}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.map(n =>
                  n.id === id ? { ...n, ...next } : n
                ),
              })),
            commit: () => syncNoteUpdate(id, next),
            rollback: (previousNotes) => {
              if (noteOperationVersions.get(id) === operationVersion) {
                set({ notes: previousNotes });
              }
            },
            reconcile: () => {
              if (noteOperationVersions.get(id) === operationVersion) {
                queueAutomaticBackup('note updated');
              }
            },
            onError: ({ error }) => {
              if (noteOperationVersions.get(id) !== operationVersion) return;
              set((state) => ({
                noteSyncErrors: {
                  ...state.noteSyncErrors,
                  [id]: {
                    action: 'update',
                    message: getOptimisticErrorMessage(error),
                    title: note.title,
                  },
                },
              }));
            },
          }).finally(() => {
            if (noteOperationVersions.get(id) === operationVersion) {
              set((state) => ({ pendingNoteIds: removePendingId(state.pendingNoteIds, id) }));
            }
          });
        },

        deleteNote: (id) => {
          if (get().pendingNoteIds.includes(id)) return;
          const note = get().notes.find((item) => item.id === id);
          if (!note) return;
          const operationVersion = getNextNoteOperationVersion(id);
          set((state) => ({
            noteSyncErrors: withoutKey(state.noteSyncErrors, id),
            pendingNoteIds: addPendingId(state.pendingNoteIds, id),
          }));
          void runOptimisticMutation<Note[], void>({
            mutationId: `note:delete:${id}`,
            snapshot: () => get().notes,
            apply: () =>
              set((state) => ({
                notes: state.notes.filter(n => n.id !== id),
              })),
            commit: () => syncNoteDelete(id),
            rollback: (previousNotes) => {
              if (noteOperationVersions.get(id) === operationVersion) {
                set({ notes: previousNotes });
              }
            },
            reconcile: () => {
              if (noteOperationVersions.get(id) === operationVersion) {
                queueAutomaticBackup('note deleted');
              }
            },
            onError: ({ error }) => {
              if (noteOperationVersions.get(id) !== operationVersion) return;
              set((state) => ({
                noteSyncErrors: {
                  ...state.noteSyncErrors,
                  [id]: {
                    action: 'delete',
                    message: getOptimisticErrorMessage(error, 'MoneyKai could not delete this note. It was restored.'),
                    title: note.title,
                  },
                },
              }));
            },
          }).finally(() => {
            if (noteOperationVersions.get(id) === operationVersion) {
              set((state) => ({ pendingNoteIds: removePendingId(state.pendingNoteIds, id) }));
            }
          });
        },

        togglePin: (id) => {
          if (get().pendingNoteIds.includes(id)) return;
          const note = get().notes.find((item) => item.id === id);
          if (!note) return;
          const next = { is_pinned: !note.is_pinned, updated_at: new Date().toISOString() };
          get().updateNote(id, next);
        },

        toggleChecklistItem: (noteId, itemId) => {
          if (get().pendingNoteIds.includes(noteId)) return;
          const note = get().notes.find((item) => item.id === noteId);
          if (!note?.checklist_items) return;
          const nextChecklistItems = note.checklist_items.map((item: ChecklistItem) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          const next = { checklist_items: nextChecklistItems, updated_at: new Date().toISOString() };
          get().updateNote(noteId, next);
        },

        addChecklistItem: (noteId, text) => {
          if (get().pendingNoteIds.includes(noteId)) return;
          const note = get().notes.find((item) => item.id === noteId);
          if (!note) return;
          const nextChecklistItems = [
            ...(note.checklist_items || []),
            { id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, text, completed: false },
          ];
          const next = { checklist_items: nextChecklistItems, updated_at: new Date().toISOString() };
          get().updateNote(noteId, next);
        },

        dismissNoteSyncError: (id) => {
          set((state) => ({ noteSyncErrors: withoutKey(state.noteSyncErrors, id) }));
        },

        retryNoteSync: async (id) => {
          if (get().pendingNoteIds.includes(id)) return;
          const error = get().noteSyncErrors[id];
          if (!error) return;
          const note = get().notes.find((item) => item.id === id);
          if (!note && error.action !== 'delete') return;
          set((state) => ({
            noteSyncErrors: withoutKey(state.noteSyncErrors, id),
            pendingNoteIds: addPendingId(state.pendingNoteIds, id),
          }));
          try {
            if (error.action === 'delete') {
              await syncNoteDelete(id);
              set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
              queueAutomaticBackup('note delete retried');
              return;
            }
            await syncNoteCreate(note as Note);
            queueAutomaticBackup('note sync retried');
          } catch (retryError) {
            set((state) => ({
              noteSyncErrors: {
                ...state.noteSyncErrors,
                [id]: {
                  ...error,
                  message: getOptimisticErrorMessage(retryError),
                },
              },
            }));
          } finally {
            set((state) => ({ pendingNoteIds: removePendingId(state.pendingNoteIds, id) }));
          }
        },

        clearSeedData: () =>
          set((state) => ({
            notes: state.notes.filter((n) => n.user_id !== 'sample'),
            isSeeded: false,
            noteSyncErrors: {},
            pendingNoteIds: [],
          })),
      };
    },
    {
      name: 'moneykai-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSeeded: state.isSeeded,
        notes: state.notes,
      }),
    }
  )
);

const addPendingId = (pendingIds: string[], id: string) =>
  pendingIds.includes(id) ? pendingIds : [...pendingIds, id];

const removePendingId = (pendingIds: string[], id: string) =>
  pendingIds.filter((pendingId) => pendingId !== id);

const withoutKey = <TValue,>(record: Record<string, TValue>, key: string) => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};
