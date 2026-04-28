import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'obsidian' | 'parchment' | 'arcane';

interface UiState {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      currentTheme: 'obsidian',
      setTheme: (theme) => set({ currentTheme: theme }),
    }),
    {
      name: 'dnd-ui-storage',
    }
  )
);
