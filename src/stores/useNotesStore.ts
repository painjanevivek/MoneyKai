import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, ChecklistItem } from '../types/note';

interface NotesState {
  notes: Note[];

  // Getters
  getPinnedNotes: () => Note[];
  getRecentNotes: (count?: number) => Note[];

  // Actions
  addNote: (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  toggleChecklistItem: (noteId: string, itemId: string) => void;
  addChecklistItem: (noteId: string, text: string) => void;
}

const SAMPLE_NOTES: Note[] = [
  {
    id: 'note1',
    user_id: 'demo',
    title: 'Monthly Budget Plan',
    content: 'Plan for the month of May. Focus on saving more and avoid unnecessary expenses.',
    is_pinned: true,
    type: 'note',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'note2',
    user_id: 'demo',
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
        notes: SAMPLE_NOTES,

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

        addNote: (note) => {
          const now = new Date().toISOString();
          const newNote: Note = {
            ...note,
            id: `note_${Date.now()}`,
            user_id: 'demo',
            created_at: now,
            updated_at: now,
          };
          set((state) => ({ notes: [newNote, ...state.notes] }));
        },

        updateNote: (id, updates) => set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n
          ),
        })),

        deleteNote: (id) => set((state) => ({
          notes: state.notes.filter(n => n.id !== id),
        })),

        togglePin: (id) => set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, is_pinned: !n.is_pinned } : n
          ),
        })),

        toggleChecklistItem: (noteId, itemId) => set((state) => ({
          notes: state.notes.map(n =>
            n.id === noteId && n.checklist_items
              ? {
                  ...n,
                  checklist_items: n.checklist_items.map((item: ChecklistItem) =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                  ),
                  updated_at: new Date().toISOString(),
                }
              : n
          ),
        })),

        addChecklistItem: (noteId, text) => set((state) => ({
          notes: state.notes.map(n =>
            n.id === noteId
              ? {
                  ...n,
                  checklist_items: [
                    ...(n.checklist_items || []),
                    { id: `cl_${Date.now()}`, text, completed: false },
                  ],
                  updated_at: new Date().toISOString(),
                }
              : n
          ),
        })),
      };
    },
    {
      name: 'smartpaisa-notes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
