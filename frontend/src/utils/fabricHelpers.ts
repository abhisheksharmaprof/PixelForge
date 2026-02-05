import { fabric } from 'fabric';

export class CanvasHelpers {
    // Align objects
    static alignObjects(
        canvas: fabric.Canvas,
        alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
    ) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length < 2) return;

        const selection = canvas.getActiveObject() as fabric.ActiveSelection;
        if (!selection) return;

        const bounds = selection.getBoundingRect();

        activeObjects.forEach(obj => {
            switch (alignment) {
                case 'left':
                    obj.set({ left: bounds.left });
                    break;
                case 'center':
                    obj.set({ left: bounds.left + (bounds.width / 2) - ((obj.width || 0) * (obj.scaleX || 1)) / 2 });
                    break;
                case 'right':
                    obj.set({ left: bounds.left + bounds.width - ((obj.width || 0) * (obj.scaleX || 1)) });
                    break;
                case 'top':
                    obj.set({ top: bounds.top });
                    break;
                case 'middle':
                    obj.set({ top: bounds.top + (bounds.height / 2) - ((obj.height || 0) * (obj.scaleY || 1)) / 2 });
                    break;
                case 'bottom':
                    obj.set({ top: bounds.top + bounds.height - ((obj.height || 0) * (obj.scaleY || 1)) });
                    break;
            }
            obj.setCoords();
        });

        canvas.renderAll();
    }

    // Distribute objects
    static distributeObjects(
        canvas: fabric.Canvas,
        direction: 'horizontal' | 'vertical'
    ) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length < 3) return;

        // Sort objects by position
        const sorted = [...activeObjects].sort((a, b) => {
            if (direction === 'horizontal') {
                return (a.left || 0) - (b.left || 0);
            } else {
                return (a.top || 0) - (b.top || 0);
            }
        });

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        let totalSize = 0;
        sorted.forEach(obj => {
            if (direction === 'horizontal') {
                totalSize += (obj.width || 0) * (obj.scaleX || 1);
            } else {
                totalSize += (obj.height || 0) * (obj.scaleY || 1);
            }
        });

        const totalSpace = direction === 'horizontal'
            ? (last.left || 0) - (first.left || 0)
            : (last.top || 0) - (first.top || 0);

        const spacing = (totalSpace - totalSize) / (sorted.length - 1);

        let currentPosition = direction === 'horizontal'
            ? (first.left || 0) + (first.width || 0) * (first.scaleX || 1) + spacing
            : (first.top || 0) + (first.height || 0) * (first.scaleY || 1) + spacing;

        for (let i = 1; i < sorted.length - 1; i++) {
            const obj = sorted[i];
            if (direction === 'horizontal') {
                obj.set({ left: currentPosition });
                currentPosition += (obj.width || 0) * (obj.scaleX || 1) + spacing;
            } else {
                obj.set({ top: currentPosition });
                currentPosition += (obj.height || 0) * (obj.scaleY || 1) + spacing;
            }
            obj.setCoords();
        }

        canvas.renderAll();
    }

    // Bring to front/back
    static bringToFront(canvas: fabric.Canvas, obj: fabric.Object) {
        canvas.bringToFront(obj);
        canvas.renderAll();
    }

    static sendToBack(canvas: fabric.Canvas, obj: fabric.Object) {
        canvas.sendToBack(obj);
        canvas.renderAll();
    }

    static bringForward(canvas: fabric.Canvas, obj: fabric.Object) {
        canvas.bringForward(obj);
        canvas.renderAll();
    }

    static sendBackwards(canvas: fabric.Canvas, obj: fabric.Object) {
        canvas.sendBackwards(obj);
        canvas.renderAll();
    }

    // Group/Ungroup
    static groupObjects(canvas: fabric.Canvas): fabric.Group | null {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length < 2) return null;

        const group = new fabric.Group(activeObjects, {
            canvas: canvas,
        });

        activeObjects.forEach(obj => canvas.remove(obj));
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();

        return group;
    }

    static ungroupObjects(canvas: fabric.Canvas, group: fabric.Group) {
        const items = group.getObjects();
        group._restoreObjectsState();
        canvas.remove(group);

        items.forEach(item => {
            canvas.add(item);
        });

        canvas.renderAll();
    }

    // Lock/Unlock
    static lockObject(obj: fabric.Object) {
        obj.set({
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            selectable: false,
            evented: false,
        });
    }

    static unlockObject(obj: fabric.Object) {
        obj.set({
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            selectable: true,
            evented: true,
        });
    }

    // Clone object
    static async cloneObject(obj: fabric.Object): Promise<fabric.Object> {
        return new Promise((resolve, reject) => {
            obj.clone((cloned: fabric.Object) => {
                cloned.set({
                    left: (obj.left || 0) + 20,
                    top: (obj.top || 0) + 20,
                });
                resolve(cloned);
            });
        });
    }

    // Get element by ID
    static getElementById(canvas: fabric.Canvas, elementId: string): fabric.Object | null {
        const objects = canvas.getObjects();
        return objects.find(obj => (obj as any).elementId === elementId) || null;
    }

    // Delete selected objects
    static deleteSelected(canvas: fabric.Canvas) {
        const activeObjects = canvas.getActiveObjects();
        activeObjects.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
    }

    // Select all objects
    static selectAll(canvas: fabric.Canvas) {
        const allObjects = canvas.getObjects();
        const selection = new fabric.ActiveSelection(allObjects, {
            canvas: canvas,
        });
        canvas.setActiveObject(selection);
        canvas.renderAll();
    }

    // Clear canvas
    static clearCanvas(canvas: fabric.Canvas) {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
    }

    // Export canvas as image
    static exportAsImage(
        canvas: fabric.Canvas,
        format: 'png' | 'jpeg' | 'svg' = 'png',
        quality: number = 1
    ): string {
        if (format === 'svg') {
            return canvas.toSVG();
        }

        return canvas.toDataURL({
            format: format,
            quality: quality,
            multiplier: 2,
        });
    }

    // Generate thumbnail
    static generateThumbnail(
        canvas: fabric.Canvas,
        width: number = 400,
        height: number = 300
    ): string {
        const multiplier = Math.min(width / canvas.width!, height / canvas.height!);

        return canvas.toDataURL({
            format: 'png',
            quality: 0.8,
            multiplier: multiplier,
        });
    }
}
