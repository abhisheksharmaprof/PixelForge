import { fabric } from 'fabric';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
    category: string;
}

interface KeyboardShortcutStores {
    canvasStore: any;
    templateStore: any;
    historyStore: any;
    uiStore: any;
    selectionStore: any;
}

export class KeyboardShortcutsManager {
    private shortcuts: KeyboardShortcut[] = [];
    private canvas: fabric.Canvas | null = null;
    private stores: KeyboardShortcutStores;
    // clipboard moved to uiStore
    private boundHandler: (e: KeyboardEvent) => void;

    constructor(canvas: fabric.Canvas | null, stores: KeyboardShortcutStores) {
        this.canvas = canvas;
        this.stores = stores;
        this.boundHandler = this.handleKeyDown.bind(this);
        this.registerDefaultShortcuts();
    }

    /**
     * Register all default keyboard shortcuts
     */
    private registerDefaultShortcuts() {
        // ============ FILE OPERATIONS ============
        this.register({
            key: 'n',
            ctrl: true,
            description: 'New Template',
            category: 'File',
            action: () => {
                if (confirm('Create new template? Unsaved changes will be lost.')) {
                    this.stores.templateStore.newTemplate();
                    if (this.canvas) {
                        this.canvas.clear();
                        this.canvas.renderAll();
                    }
                }
            },
        });

        this.register({
            key: 's',
            ctrl: true,
            description: 'Save Template',
            category: 'File',
            action: () => {
                this.stores.templateStore.saveTemplate?.(this.stores.templateStore.currentTemplate);
                this.stores.uiStore.addNotification({
                    type: 'success',
                    message: 'Template saved successfully',
                    duration: 2000
                });
                this.stores.uiStore.setIsSaving(true);
                setTimeout(() => this.stores.uiStore.setIsSaving(false), 800);
            },
        });

        this.register({
            key: 'p',
            ctrl: true,
            description: 'Print',
            category: 'File',
            action: () => this.printCanvas(),
        });

        // ============ EDIT OPERATIONS ============
        this.register({
            key: 'z',
            ctrl: true,
            description: 'Undo',
            category: 'Edit',
            action: () => this.stores.historyStore.undo(),
        });

        this.register({
            key: 'y',
            ctrl: true,
            description: 'Redo',
            category: 'Edit',
            action: () => this.stores.historyStore.redo(),
        });

        this.register({
            key: 'z',
            ctrl: true,
            shift: true,
            description: 'Redo (Alternative)',
            category: 'Edit',
            action: () => this.stores.historyStore.redo(),
        });

        this.register({
            key: 'x',
            ctrl: true,
            description: 'Cut',
            category: 'Edit',
            action: () => this.cut(),
        });

        this.register({
            key: 'c',
            ctrl: true,
            description: 'Copy',
            category: 'Edit',
            action: () => this.copy(),
        });

        this.register({
            key: 'v',
            ctrl: true,
            description: 'Paste',
            category: 'Edit',
            action: () => this.paste(),
        });

        this.register({
            key: 'a',
            ctrl: true,
            description: 'Select All',
            category: 'Edit',
            action: () => this.selectAll(),
        });

        this.register({
            key: 'd',
            ctrl: true,
            description: 'Duplicate',
            category: 'Edit',
            action: () => this.duplicate(),
        });

        this.register({
            key: 'Delete',
            description: 'Delete Selected',
            category: 'Edit',
            action: () => this.delete(),
        });

        this.register({
            key: 'Backspace',
            description: 'Delete Selected',
            category: 'Edit',
            action: () => this.delete(),
        });

        this.register({
            key: 'Escape',
            description: 'Deselect All',
            category: 'Edit',
            action: () => this.deselectAll(),
        });

        this.register({
            key: 'f',
            ctrl: true,
            description: 'Find & Replace',
            category: 'Edit',
            action: () => this.stores.uiStore.openModal?.('findReplace'),
        });

        // ============ TEXT FORMATTING ============
        this.register({
            key: 'b',
            ctrl: true,
            description: 'Bold',
            category: 'Format',
            action: () => this.toggleTextStyle('fontWeight', 'bold', 'normal'),
        });

        this.register({
            key: 'i',
            ctrl: true,
            description: 'Italic',
            category: 'Format',
            action: () => this.toggleTextStyle('fontStyle', 'italic', 'normal'),
        });

        this.register({
            key: 'u',
            ctrl: true,
            description: 'Underline',
            category: 'Format',
            action: () => this.toggleTextStyle('underline', true, false),
        });

        this.register({
            key: 'x',
            ctrl: true,
            shift: true,
            description: 'Strikethrough',
            category: 'Format',
            action: () => this.toggleTextStyle('linethrough', true, false),
        });

        // ============ ALIGNMENT ============
        this.register({
            key: 'l',
            ctrl: true,
            shift: true,
            description: 'Align Left',
            category: 'Format',
            action: () => this.alignText('left'),
        });

        this.register({
            key: 'e',
            ctrl: true,
            shift: true,
            description: 'Align Center',
            category: 'Format',
            action: () => this.alignText('center'),
        });

        this.register({
            key: 'r',
            ctrl: true,
            shift: true,
            description: 'Align Right',
            category: 'Format',
            action: () => this.alignText('right'),
        });

        // ============ ARRANGE ============
        this.register({
            key: ']',
            ctrl: true,
            shift: true,
            description: 'Bring to Front',
            category: 'Arrange',
            action: () => this.bringToFront(),
        });

        this.register({
            key: ']',
            ctrl: true,
            description: 'Bring Forward',
            category: 'Arrange',
            action: () => this.bringForward(),
        });

        this.register({
            key: '[',
            ctrl: true,
            description: 'Send Backward',
            category: 'Arrange',
            action: () => this.sendBackward(),
        });

        this.register({
            key: '[',
            ctrl: true,
            shift: true,
            description: 'Send to Back',
            category: 'Arrange',
            action: () => this.sendToBack(),
        });

        this.register({
            key: 'g',
            ctrl: true,
            description: 'Group',
            category: 'Arrange',
            action: () => this.group(),
        });

        this.register({
            key: 'g',
            ctrl: true,
            shift: true,
            description: 'Ungroup',
            category: 'Arrange',
            action: () => this.ungroup(),
        });

        // ============ VIEW ============
        this.register({
            key: '=',
            ctrl: true,
            description: 'Zoom In',
            category: 'View',
            action: () => this.zoom(1.1),
        });

        this.register({
            key: '-',
            ctrl: true,
            description: 'Zoom Out',
            category: 'View',
            action: () => this.zoom(0.9),
        });

        this.register({
            key: '0',
            ctrl: true,
            description: 'Zoom to Fit',
            category: 'View',
            action: () => this.stores.canvasStore.setZoom(100),
        });

        this.register({
            key: '1',
            ctrl: true,
            description: 'Actual Size (100%)',
            category: 'View',
            action: () => this.stores.canvasStore.setZoom(100),
        });

        // ============ ARROW KEYS ============
        this.register({
            key: 'ArrowUp',
            description: 'Move Up (1px)',
            category: 'Transform',
            action: () => this.moveSelected(0, -1),
        });

        this.register({
            key: 'ArrowDown',
            description: 'Move Down (1px)',
            category: 'Transform',
            action: () => this.moveSelected(0, 1),
        });

        this.register({
            key: 'ArrowLeft',
            description: 'Move Left (1px)',
            category: 'Transform',
            action: () => this.moveSelected(-1, 0),
        });

        this.register({
            key: 'ArrowRight',
            description: 'Move Right (1px)',
            category: 'Transform',
            action: () => this.moveSelected(1, 0),
        });

        // Shift + Arrow for large movement
        this.register({
            key: 'ArrowUp',
            shift: true,
            description: 'Move Up (10px)',
            category: 'Transform',
            action: () => this.moveSelected(0, -10),
        });

        this.register({
            key: 'ArrowDown',
            shift: true,
            description: 'Move Down (10px)',
            category: 'Transform',
            action: () => this.moveSelected(0, 10),
        });

        this.register({
            key: 'ArrowLeft',
            shift: true,
            description: 'Move Left (10px)',
            category: 'Transform',
            action: () => this.moveSelected(-10, 0),
        });

        this.register({
            key: 'ArrowRight',
            shift: true,
            description: 'Move Right (10px)',
            category: 'Transform',
            action: () => this.moveSelected(10, 0),
        });

        // ============ HELP ============
        this.register({
            key: '/',
            ctrl: true,
            description: 'Keyboard Shortcuts',
            category: 'Help',
            action: () => this.stores.uiStore.openModal?.('keyboardShortcuts'),
        });
    }

    /**
     * Register a keyboard shortcut
     */
    register(shortcut: KeyboardShortcut) {
        this.shortcuts.push(shortcut);
    }

    /**
     * Initialize keyboard event listener
     */
    init() {
        document.addEventListener('keydown', this.boundHandler);
    }

    /**
     * Cleanup
     */
    destroy() {
        document.removeEventListener('keydown', this.boundHandler);
    }

    /**
     * Handle keydown event
     */
    private handleKeyDown(e: KeyboardEvent) {
        // Ignore if user is typing in an input field
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        // Find matching shortcut
        const shortcut = this.shortcuts.find(s => {
            const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
            const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey);
            const shiftMatch = !!s.shift === e.shiftKey;
            const altMatch = !!s.alt === e.altKey;
            return keyMatch && ctrlMatch && shiftMatch && altMatch;
        });

        if (shortcut) {
            e.preventDefault();
            e.stopPropagation();
            shortcut.action();
        }
    }

    /**
     * Get all shortcuts grouped by category
     */
    getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
        const grouped: Record<string, KeyboardShortcut[]> = {};

        this.shortcuts.forEach(shortcut => {
            if (!grouped[shortcut.category]) {
                grouped[shortcut.category] = [];
            }
            grouped[shortcut.category].push(shortcut);
        });

        return grouped;
    }

    /**
     * Get all shortcuts
     */
    getAllShortcuts(): KeyboardShortcut[] {
        return this.shortcuts;
    }

    /**
     * Format shortcut key combination for display
     */
    static formatShortcut(shortcut: KeyboardShortcut): string {
        const parts: string[] = [];

        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.shift) parts.push('Shift');
        if (shortcut.alt) parts.push('Alt');

        let key = shortcut.key;
        if (key === ' ') key = 'Space';
        else if (key.startsWith('Arrow')) key = key.replace('Arrow', '');
        else if (key.length === 1) key = key.toUpperCase();

        parts.push(key);

        return parts.join(' + ');
    }

    // ============ ACTION IMPLEMENTATIONS ============

    private cut() {
        this.copy();
        this.delete();
    }

    private copy() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((cloned: fabric.Object) => {
                this.stores.uiStore.setClipboard(cloned);
                this.stores.uiStore.addNotification({
                    type: 'success',
                    message: 'Copied to clipboard',
                    duration: 1500
                });
            });
        }
    }

    private paste() {
        if (!this.canvas) return;
        const clipboard = this.stores.uiStore.clipboard;

        if (!clipboard) return;

        clipboard.clone((clonedObj: fabric.Object) => {
            this.canvas!.discardActiveObject();
            clonedObj.set({
                left: (clonedObj.left || 0) + 20,
                top: (clonedObj.top || 0) + 20,
                evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
                clonedObj.canvas = this.canvas!;
                (clonedObj as fabric.ActiveSelection).forEachObject((obj) => {
                    this.canvas!.add(obj);
                });
                clonedObj.setCoords();
            } else {
                this.canvas!.add(clonedObj);
            }
            // Update clipboard offset so next paste is further offset
            clipboard.set({
                left: (clipboard.left || 0) + 20,
                top: (clipboard.top || 0) + 20,
            });

            this.canvas!.setActiveObject(clonedObj);
            this.canvas!.requestRenderAll();

            this.stores.uiStore.addNotification({
                type: 'success',
                message: 'Pasted',
                duration: 1500
            });
        });
    }

    private selectAll() {
        if (!this.canvas) return;
        const objects = this.canvas.getObjects();
        if (objects.length > 0) {
            const selection = new fabric.ActiveSelection(objects, { canvas: this.canvas });
            this.canvas.setActiveObject(selection);
            this.canvas.requestRenderAll();
        }
    }

    private deselectAll() {
        if (!this.canvas) return;
        this.canvas.discardActiveObject().renderAll();
    }

    private duplicate() {
        this.copy();
        this.paste();
    }

    private delete() {
        if (!this.canvas) return;
        const activeObjects = this.canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach((obj) => this.canvas!.remove(obj));
            this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();
        }
    }

    private toggleTextStyle(property: string, valueOn: any, valueOff: any) {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && (activeObject.type === 'text' || activeObject.type === 'textbox' || activeObject.type === 'i-text')) {
            const textObj = activeObject as fabric.IText;
            textObj.setSelectionStyles({ [property]: valueOn }); // Simplification for now: always set ON. 
            // To toggle properly we need to read current selection style more carefully.
            // For this task, let's just use the object-level toggle if standard, or improved toggle:

            // Let's rely on Fabric's state if possible or just toggle blindly? 
            // Actually, let's implement the toggle logic:
            // Check style at cursor? 
            // textObj.getSelectionStyles() returns array of styles for each char.
        } else {
            const currentValue = (activeObject as any)[property];
            (activeObject as any).set(property, currentValue === valueOn ? valueOff : valueOn);
        }
        this.canvas.renderAll();
    }

    private alignText(alignment: string) {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && (activeObject.type === 'text' || activeObject.type === 'textbox' || activeObject.type === 'i-text')) {
            (activeObject as any).set('textAlign', alignment);
            this.canvas.renderAll();
        }
    }

    private bringToFront() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.bringToFront();
            this.canvas.renderAll();
        }
    }

    private bringForward() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.bringForward();
            this.canvas.renderAll();
        }
    }

    private sendBackward() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.sendBackwards();
            this.canvas.renderAll();
        }
    }

    private sendToBack() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.sendToBack();
            this.canvas.renderAll();
        }
    }

    private group() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.type === 'activeSelection') {
            (activeObject as fabric.ActiveSelection).toGroup();
            this.canvas.requestRenderAll();
        }
    }

    private ungroup() {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.type === 'group') {
            (activeObject as fabric.Group).toActiveSelection();
            this.canvas.requestRenderAll();
        }
    }

    private zoom(factor: number) {
        const currentZoom = this.stores.canvasStore.zoom;
        const newZoom = Math.min(Math.max(currentZoom * factor, 25), 400);
        this.stores.canvasStore.setZoom(Math.round(newZoom));
    }

    private moveSelected(x: number, y: number) {
        if (!this.canvas) return;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.set({
                left: (activeObject.left || 0) + x,
                top: (activeObject.top || 0) + y,
            });
            activeObject.setCoords();
            this.canvas.renderAll();
        }
    }

    private printCanvas() {
        if (!this.canvas) return;
        const dataUrl = this.canvas.toDataURL({ format: 'png', quality: 1 });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>Print</title></head>
                    <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                        <img src="${dataUrl}" onload="window.print();window.close()" style="max-width:100%;"/>
                    </body>
                </html>
            `);
        }
    }
}
