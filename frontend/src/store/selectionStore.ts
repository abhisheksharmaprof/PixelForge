import { create } from 'zustand';
import { fabric } from 'fabric';

interface SelectionState {
    selectedObjects: fabric.Object[];
    setSelection: (objects: fabric.Object[]) => void;
    clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedObjects: [],
    setSelection: (objects) => set({ selectedObjects: objects }),
    clearSelection: () => set({ selectedObjects: [] }),
}));
