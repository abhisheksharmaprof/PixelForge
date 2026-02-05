import { useEffect } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/canvasStore';
import { useSelectionStore } from '../store/selectionStore';
import { useHistoryStore } from '../store/historyStore';

export const useKeyboardShortcuts = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { undo, redo, addToHistory } = useHistoryStore();

    useEffect(() => {
        if (!canvas) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (
                (e.target as HTMLElement).tagName === 'INPUT' ||
                (e.target as HTMLElement).tagName === 'TEXTAREA' ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            // Delete / Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedObjects.length > 0) {
                    selectedObjects.forEach((obj) => canvas.remove(obj));
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                    addToHistory('Deleted objects', canvas.toJSON());
                }
            }

            // Undo: Ctrl+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            // Redo: Ctrl+Y or Ctrl+Shift+Z
            if (
                ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
            ) {
                e.preventDefault();
                redo();
            }

            // Select All: Ctrl+A
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const objects = canvas.getObjects();
                if (objects.length > 0) {
                    const selection = new fabric.ActiveSelection(objects, {
                        canvas: canvas,
                    });
                    canvas.setActiveObject(selection);
                    canvas.requestRenderAll();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [canvas, selectedObjects, undo, redo]);
};
