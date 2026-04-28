import { StateStorage } from 'zustand/middleware';

// Default to localStorage for now, but abstracts the storage mechanism
// so we can easily swap to an async remote storage (e.g., Supabase) later.
export const storageAdapter: StateStorage = {
  getItem: (name: string): string | Promise<string | null> | null => {
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void | Promise<void> => {
    localStorage.removeItem(name);
  },
};
