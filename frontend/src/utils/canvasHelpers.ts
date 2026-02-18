import { fabric } from 'fabric';

export class CanvasHelpers {
    static selectAll(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        canvas.discardActiveObject();
        const sel = new fabric.ActiveSelection(canvas.getObjects(), {
            canvas: canvas,
        });
        canvas.setActiveObject(sel);
        canvas.requestRenderAll();
    }

    static deleteSelected(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => {
                canvas.remove(obj);
            });
            canvas.requestRenderAll();
        }
    }

    static alignObjects(canvas: fabric.Canvas | null, alignment: string) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject.type === 'activeSelection') {
            const activeSelection = activeObject as fabric.ActiveSelection;
            const objects = activeSelection.getObjects();

            if (objects.length < 2) return;

            const groupWidth = activeObject.width || 0;
            const groupHeight = activeObject.height || 0;
            const groupLeft = activeObject.left || 0;
            const groupTop = activeObject.top || 0;

            switch (alignment) {
                case 'left':
                    objects.forEach(obj => {
                        obj.set({
                            left: -(groupWidth / 2),
                            originX: 'left'
                        });
                    });
                    break;
                case 'center':
                    objects.forEach(obj => {
                        obj.set({
                            left: 0,
                            originX: 'center'
                        });
                    });
                    break;
                case 'right':
                    objects.forEach(obj => {
                        obj.set({
                            left: groupWidth / 2,
                            originX: 'right'
                        });
                    });
                    break;
                case 'top':
                    objects.forEach(obj => {
                        obj.set({
                            top: -(groupHeight / 2),
                            originY: 'top'
                        });
                    });
                    break;
                case 'middle':
                    objects.forEach(obj => {
                        obj.set({
                            top: 0,
                            originY: 'center'
                        });
                    });
                    break;
                case 'bottom':
                    objects.forEach(obj => {
                        obj.set({
                            top: groupHeight / 2,
                            originY: 'bottom'
                        });
                    });
                    break;
            }

            // Trigger update
            activeSelection.addWithUpdate();
            canvas.renderAll();
        } else {
            // Align single object to canvas center/edges if needed, 
            // but typically 'Align' refers to multiple objects. 
            // For single object, it might mean align to page.
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();

            switch (alignment) {
                case 'center':
                    activeObject.centerH();
                    break;
                case 'middle':
                    activeObject.centerV();
                    break;
                // Add other alignments relative to canvas if desired
            }
            activeObject.setCoords();
            canvas.renderAll();
        }
    }

    static distributeObjects(canvas: fabric.Canvas | null, direction: 'horizontal' | 'vertical') {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'activeSelection') return;

        const activeSelection = activeObject as fabric.ActiveSelection;
        const objects = activeSelection.getObjects();

        if (objects.length < 3) return;

        if (direction === 'horizontal') {
            const sorted = [...objects].sort((a, b) => (a.left || 0) - (b.left || 0));
            const minLeft = sorted[0].left || 0;
            const maxLeft = sorted[sorted.length - 1].left || 0;
            const totalWidth = maxLeft - minLeft;
            const step = totalWidth / (sorted.length - 1);

            sorted.forEach((obj, index) => {
                obj.set('left', minLeft + step * index);
            });
        } else {
            const sorted = [...objects].sort((a, b) => (a.top || 0) - (b.top || 0));
            const minTop = sorted[0].top || 0;
            const maxTop = sorted[sorted.length - 1].top || 0;
            const totalHeight = maxTop - minTop;
            const step = totalHeight / (sorted.length - 1);

            sorted.forEach((obj, index) => {
                obj.set('top', minTop + step * index);
            });
        }

        activeSelection.addWithUpdate();
        canvas.renderAll();
    }

    static bringToFront(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.bringToFront();
            canvas.renderAll();
        }
    }

    static bringForward(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.bringForward();
            canvas.renderAll();
        }
    }

    static sendBackward(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.sendBackwards();
            canvas.renderAll();
        }
    }

    static sendToBack(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.sendToBack();
            canvas.renderAll();
        }
    }

    static groupObjects(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'activeSelection') return;

        (activeObject as fabric.ActiveSelection).toGroup();
        canvas.requestRenderAll();
    }

    static ungroupObjects(canvas: fabric.Canvas | null) {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'group') return;

        (activeObject as fabric.Group).toActiveSelection();
        canvas.requestRenderAll();
    }

    /**
     * Serializes the canvas to JSON, ensuring that any placeholders in Preview Mode
     * are saved with their original placeholder text ({{Name}}) instead of the preview value.
     */
    static getCanvasData(canvas: fabric.Canvas | null) {
        if (!canvas) return null;

        const objects = canvas.getObjects();
        const modifiedObjects: { obj: fabric.Object; originalText: string }[] = [];

        // Temporarily revert text to placeholder for serialization
        objects.forEach((obj: any) => {
            if (obj.originalText) {
                // Store current preview text to restore later
                modifiedObjects.push({
                    obj,
                    originalText: obj.text || '' // The current preview value
                });

                // Set text back to the placeholder ({{Name}})
                obj.text = obj.originalText;
            }
        });

        // Serialize
        const json = canvas.toJSON([
            'id',
            'data',
            'originalText',
            'name',
            'description',
            'lockMovementX',
            'lockMovementY',
            'lockRotation',
            'lockScalingX',
            'lockScalingY',
            'selectable',
            'evented',
            'hoverCursor',
            'moveCursor'
        ]);

        // Restore preview values
        modifiedObjects.forEach(({ obj, originalText }) => {
            // We set it back to the PREVIEW value we saved
            // Wait, obj.originalText is the PLACEHOLDER.
            // modifiedObjects stores the PREVIEW value in 'originalText' property?
            // Let's be clear:
            // 1. obj.text is "Marketing" (Preview)
            // 2. obj.originalText is "{{Project Name}}" (Placeholder)

            // We want to save "{{Project Name}}"
            // So we set obj.text = obj.originalText

            // Then after save, we want to restore "Marketing"
            // So we set obj.text back to what it was

            (obj as any).text = originalText;
        });

        // We don't need to renderAll because this happens synchronously and we restore immediately
        // But just in case
        // canvas.requestRenderAll(); 

        return json;
    }
}
