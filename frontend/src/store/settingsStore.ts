import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    // Auto-save settings
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // in minutes
    lastAutoSave: string | null;

    // Notification settings
    notifyOnSave: boolean;
    notifyOnAutoSave: boolean;

    // Template naming
    defaultTemplatePrefix: string;
    templateCounter: number;

    // Actions
    setAutoSaveEnabled: (enabled: boolean) => void;
    setAutoSaveInterval: (interval: number) => void;
    setLastAutoSave: (time: string) => void;
    setNotifyOnSave: (notify: boolean) => void;
    setNotifyOnAutoSave: (notify: boolean) => void;
    setDefaultTemplatePrefix: (prefix: string) => void;
    incrementTemplateCounter: () => number;
    generateDefaultTemplateName: () => string;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            // Default values
            autoSaveEnabled: true,
            autoSaveInterval: 5, // 5 minutes
            lastAutoSave: null,
            notifyOnSave: true,
            notifyOnAutoSave: true,
            defaultTemplatePrefix: 'Untitled Design',
            templateCounter: 0,

            // Setters
            setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
            setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
            setLastAutoSave: (time) => set({ lastAutoSave: time }),
            setNotifyOnSave: (notify) => set({ notifyOnSave: notify }),
            setNotifyOnAutoSave: (notify) => set({ notifyOnAutoSave: notify }),
            setDefaultTemplatePrefix: (prefix) => set({ defaultTemplatePrefix: prefix }),

            incrementTemplateCounter: () => {
                const newCounter = get().templateCounter + 1;
                set({ templateCounter: newCounter });
                return newCounter;
            },

            generateDefaultTemplateName: () => {
                const { defaultTemplatePrefix, templateCounter } = get();
                const newCounter = templateCounter + 1;
                set({ templateCounter: newCounter });
                return `${defaultTemplatePrefix} ${newCounter}`;
            },
        }),
        {
            name: 'settings-storage',
            partialize: (state) => ({
                autoSaveEnabled: state.autoSaveEnabled,
                autoSaveInterval: state.autoSaveInterval,
                notifyOnSave: state.notifyOnSave,
                notifyOnAutoSave: state.notifyOnAutoSave,
                defaultTemplatePrefix: state.defaultTemplatePrefix,
                templateCounter: state.templateCounter,
            }),
        }
    )
);
