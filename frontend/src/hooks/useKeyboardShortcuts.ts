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
            // Ignore if typing in an input (unless it's the canvas itself which handles events)
            // But we need to catch these global shortcuts even if focused on canvas,
            // so we only ignore if focused on specific inputs outside canvas
            if (
                ((e.target as HTMLElement).tagName === 'INPUT' ||
                    (e.target as HTMLElement).tagName === 'TEXTAREA') &&
                !(e.target as HTMLElement).classList.contains('upper-canvas') // Fabric's upper canvas
            ) {
                return;
            }

            const activeObject = canvas.getActiveObject() as any;
            const isText = activeObject && (activeObject.type === 'textbox' || activeObject.type === 'i-text');

            // Delete / Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Only delete if not editing text
                if (!activeObject?.isEditing) {
                    if (selectedObjects.length > 0) {
                        selectedObjects.forEach((obj) => canvas.remove(obj));
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                        addToHistory('Deleted objects', canvas.toJSON());
                    }
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
                // If editing text, let default behavior happen (select all text)
                if (isText && activeObject.isEditing) return;

                const objects = canvas.getObjects();
                if (objects.length > 0) {
                    const selection = new fabric.ActiveSelection(objects, {
                        canvas: canvas,
                    });
                    canvas.setActiveObject(selection);
                    canvas.requestRenderAll();
                }
            }

            // --- Text Formatting Shortcuts ---
            if (isText) {
                // Bold: Ctrl+B
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    // Toggle bold
                    const currentWeight = activeObject.fontWeight === 'bold' || activeObject.fontWeight === 700 ? 'normal' : 'bold';
                    activeObject.set('fontWeight', currentWeight);
                    canvas.requestRenderAll();
                    addToHistory('Toggle Bold', canvas.toJSON());
                }

                // Italic: Ctrl+I
                if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                    e.preventDefault();
                    const currentStyle = activeObject.fontStyle === 'italic' ? 'normal' : 'italic';
                    activeObject.set('fontStyle', currentStyle);
                    canvas.requestRenderAll();
                    addToHistory('Toggle Italic', canvas.toJSON());
                }

                // Underline: Ctrl+U
                if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                    e.preventDefault();
                    activeObject.set('underline', !activeObject.underline);
                    canvas.requestRenderAll();
                    addToHistory('Toggle Underline', canvas.toJSON());
                }

                // Strikethrough: Ctrl+Shift+X
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
                    e.preventDefault();
                    activeObject.set('linethrough', !activeObject.linethrough);
                    canvas.requestRenderAll();
                    addToHistory('Toggle Strikethrough', canvas.toJSON());
                }

                // Alignment
                if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                    if (e.key.toLowerCase() === 'l') { activeObject.set('textAlign', 'left'); canvas.requestRenderAll(); }
                    if (e.key.toLowerCase() === 'e') { activeObject.set('textAlign', 'center'); canvas.requestRenderAll(); }
                    if (e.key.toLowerCase() === 'r') { activeObject.set('textAlign', 'right'); canvas.requestRenderAll(); }
                    if (e.key.toLowerCase() === 'j') { activeObject.set('textAlign', 'justify'); canvas.requestRenderAll(); }
                }

                // Font Size: Ctrl+Shift+> / <
                if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                    if (e.key === '>' || e.key === '.') {
                        e.preventDefault();
                        activeObject.set('fontSize', (activeObject.fontSize || 16) + 1);
                        canvas.requestRenderAll();
                    }
                    if (e.key === '<' || e.key === ',') {
                        e.preventDefault();
                        activeObject.set('fontSize', Math.max(1, (activeObject.fontSize || 16) - 1));
                        canvas.requestRenderAll();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [canvas, selectedObjects, undo, redo]);
};
