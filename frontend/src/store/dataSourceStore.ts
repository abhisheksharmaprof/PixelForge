import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DataSource } from '../types/mailMergeTypes';

interface DataSourceState {
    savedSources: DataSource[];
    addSource: (source: DataSource) => void;
    removeSource: (id: string) => void;
    updateSource: (id: string, updates: Partial<DataSource>) => void;
    getSource: (id: string) => DataSource | undefined;
}

export const useDataSourceStore = create<DataSourceState>()(
    persist(
        (set, get) => ({
            savedSources: [],
            addSource: (source) => set((state) => ({
                savedSources: [...state.savedSources, source]
            })),
            removeSource: (id) => set((state) => ({
                savedSources: state.savedSources.filter(s => s.id !== id)
            })),
            updateSource: (id, updates) => set((state) => ({
                savedSources: state.savedSources.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                )
            })),
            getSource: (id) => get().savedSources.find(s => s.id === id),
        }),
        {
            name: 'data-source-storage',
            // partially persist? or all? All is fine for now.
        }
    )
);
