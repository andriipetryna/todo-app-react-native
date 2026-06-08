import { create } from 'zustand';

/**
 * Ephemeral UI state only (per CLAUDE.md). Persisted data lives in SQLite and is read
 * through the repositories via the data store — never here.
 */

/** Group filter: a specific group id, `null` for ungrouped, or 'all'. */
export type GroupFilter = number | null | 'all';

interface UiState {
  groupFilter: GroupFilter;
  showCompleted: boolean;
  setGroupFilter: (filter: GroupFilter) => void;
  toggleShowCompleted: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  groupFilter: 'all',
  showCompleted: false,
  setGroupFilter: (groupFilter) => set({ groupFilter }),
  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),
}));
