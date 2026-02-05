import { create } from 'zustand';
import { useCanvasStore } from './canvasStore';

interface HistoryState {
    past: any[]; // Array of canvas states (JSON)
    future: any[];
    isRestoring: boolean; // Flag to prevent history during restore
    addToHistory: (action: string, state: any) => void;
    saveInitialState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    past: [],
    future: [],
    isRestoring: false,
    canUndo: false,
    canRedo: false,

    saveInitialState: () => {
        const canvas = useCanvasStore.getState().canvas;
        if (canvas && get().past.length === 0) {
            set({
                past: [canvas.toJSON()],
                canUndo: false, // Can't undo initial state
            });
        }
    },

    addToHistory: (action, state) => {
        // Don't add to history if we're restoring state
        if (get().isRestoring) return;

        set((prev) => {
            // Don't add duplicate states
            const lastState = prev.past[prev.past.length - 1];
            if (lastState && JSON.stringify(lastState) === JSON.stringify(state)) {
                return prev;
            }

            const newPast = [...prev.past, state];
            // Limit history depth
            if (newPast.length > 50) newPast.shift();

            return {
                past: newPast,
                future: [], // Clear future on new action
                canUndo: newPast.length > 1, // Need at least 2 states to undo
                canRedo: false,
            };
        });
    },

    undo: () => {
        const { past, future, isRestoring } = get();
        if (past.length <= 1 || isRestoring) return; // Need at least 2 states

        const currentState = past[past.length - 1];
        const previousState = past[past.length - 2];
        const newPast = past.slice(0, past.length - 1);

        const canvas = useCanvasStore.getState().canvas;
        if (canvas && previousState) {
            set({ isRestoring: true });

            set({
                past: newPast,
                future: [currentState, ...future],
                canUndo: newPast.length > 1,
                canRedo: true,
            });

            canvas.loadFromJSON(previousState, () => {
                canvas.renderAll();
                set({ isRestoring: false });
            });
        }
    },

    redo: () => {
        const { past, future, isRestoring } = get();
        if (future.length === 0 || isRestoring) return;

        const nextState = future[0];
        const newFuture = future.slice(1);

        const canvas = useCanvasStore.getState().canvas;
        if (canvas && nextState) {
            set({ isRestoring: true });

            set({
                past: [...past, nextState],
                future: newFuture,
                canUndo: true,
                canRedo: newFuture.length > 0,
            });

            canvas.loadFromJSON(nextState, () => {
                canvas.renderAll();
                set({ isRestoring: false });
            });
        }
    },

    clearHistory: () => {
        set({
            past: [],
            future: [],
            canUndo: false,
            canRedo: false,
            isRestoring: false,
        });
    },
}));

