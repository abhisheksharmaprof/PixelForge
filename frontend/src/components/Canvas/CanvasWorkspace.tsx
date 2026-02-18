import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

// Fix: Fabric.js v5 uses 'alphabetical' as textBaseline which is deprecated
// and rejected by newer Chrome versions, causing text rendering to silently fail.
// Patch the canvas context to correct this value.
const _origTextBaselineDescriptor = Object.getOwnPropertyDescriptor(
    CanvasRenderingContext2D.prototype, 'textBaseline'
);
if (_origTextBaselineDescriptor && _origTextBaselineDescriptor.set) {
    const _origSetter = _origTextBaselineDescriptor.set;
    const _origGetter = _origTextBaselineDescriptor.get;
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'textBaseline', {
        set(value: string) {
            if (value === 'alphabetical') {
                value = 'alphabetic';
            }
            _origSetter.call(this, value);
        },
        get() {
            return _origGetter ? _origGetter.call(this) : 'alphabetic';
        },
        configurable: true,
    });
}

import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUIStore } from '../../store/uiStore';
import { useHistoryStore } from '../../store/historyStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { CanvasGrid } from './CanvasGrid';
import { CanvasGuides } from './CanvasGuides';
import { FabricTable } from './objects/FabricTable';
import './CanvasWorkspace.css';

export const CanvasWorkspace: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizingStateRef = useRef<{ table: FabricTable, type: 'row' | 'col', index: number, startVal: number, startMouse: number } | null>(null);

    const {
        canvas,
        setCanvas,
        canvasSize,
        backgroundColor,
        backgroundImage,
        zoom,
        showGrid,
        showGuides,
        snapToGrid,
        snapToObjects,
        gridSize,
        margins,
        watermark,
    } = useCanvasStore();

    const {
        dataSource,
        fields,
        filteredRows,
        previewRecordIndex,
        isPreviewMode,
    } = useMailMergeStore();

    // We'll maintain a local mappings for legacy support or unified handling
    const mappings = React.useMemo(() => {
        const m: Record<string, string> = {};
        fields.forEach(f => m[f.name] = f.name);
        return m;
    }, [fields]);

    const { setSelection } = useSelectionStore();
    const { addToHistory } = useHistoryStore();

    // Initialize Fabric Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: backgroundColor,
            preserveObjectStacking: true,
            selection: true,
            renderOnAddRemove: true,
            controlsAboveOverlay: true,
            allowTouchScrolling: false,
            snapAngle: 15,
            snapThreshold: 10,
        });

        // Configure default object properties
        fabric.Object.prototype.set({
            borderColor: '#3B82F6', // Blue as per spec
            cornerColor: '#FFFFFF', // White fill
            cornerStrokeColor: '#3B82F6', // Blue border
            cornerStyle: 'rect', // Square handles
            cornerSize: 8, // 8px
            transparentCorners: false,
            borderScaleFactor: 1, // 1px border
            padding: 5,
        });

        setCanvas(fabricCanvas);
        // @ts-ignore
        window.canvas = fabricCanvas; // Required for drop handler to avoid stale closure

        return () => {
            setCanvas(null);
            fabricCanvas.dispose();
        };
    }, []);

    // Update canvas size
    useEffect(() => {
        if (!canvas || (canvas as any).disposed) return;
        canvas.setDimensions({
            width: canvasSize.width,
            height: canvasSize.height,
        });
        canvas.renderAll();
    }, [canvas, canvasSize]);

    // Update background color
    useEffect(() => {
        if (!canvas || (canvas as any).disposed) return;
        canvas.setBackgroundColor(backgroundColor, () => {
            canvas.renderAll();
        });
    }, [canvas, backgroundColor]);

    // Update background image
    useEffect(() => {
        if (!canvas || (canvas as any).disposed) return;

        if (backgroundImage) {
            fabric.Image.fromURL(backgroundImage, (img) => {
                canvas.setBackgroundImage(img, () => {
                    canvas.renderAll();
                }, {
                    scaleX: canvas.width! / img.width!,
                    scaleY: canvas.height! / img.height!,
                });
            });
        } else {
            canvas.setBackgroundImage((null as unknown) as fabric.Image, () => {
                canvas.renderAll();
            });
        }
    }, [canvas, backgroundImage]);

    // Update zoom - CSS transform on the container handles visual scaling.
    // We only need to trigger a re-render when zoom changes.
    useEffect(() => {
        if (!canvas) return;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // Reset to identity (no internal zoom)
        canvas.renderAll();
    }, [canvas, zoom]);

    // Selection events
    useEffect(() => {
        if (!canvas) return;

        const handleSelection = (e: fabric.IEvent) => {
            const selected = (e as any).selected || canvas.getActiveObjects();
            console.log('[DEBUG handleSelection] selected count:', selected?.length, 'types:', selected?.map((o: any) => `${o.type}/${o.elementType}/${o.constructor?.name}`));
            if (selected && selected.length > 0) {
                setSelection([...selected] as fabric.Object[]);
                useUIStore.getState().setRightPanelOpen(true);
            }
        };

        const handleSelectionCleared = () => {
            // Check if any table on canvas is mid-update — if so, ignore this event
            const objects = canvas.getObjects();
            const anyUpdating = objects.some((obj: any) => obj._isUpdating === true);
            console.log('[DEBUG handleSelectionCleared] anyUpdating:', anyUpdating);
            if (anyUpdating) return; // Skip — table is rebuilding internally

            setSelection([]);
        };

        const handleMouseDown = (opt: fabric.IEvent) => {
            const target = opt.target;

            // Triple click detection logic
            // Fabric doesn't have native triple click, so we simulate it
            if (target && (target.type === 'i-text' || target.type === 'textbox')) {
                const textTarget = target as any;
                const now = new Date().getTime();

                const lastClickTime = textTarget.__lastClickTime || 0;
                const clickCount = textTarget.__clickCount || 0;

                if (now - lastClickTime < 500) {
                    // Consecutive click
                    textTarget.__clickCount = clickCount + 1;

                    if (textTarget.__clickCount === 3) {
                        // Triple Click - Select All
                        (target as fabric.IText).enterEditing();
                        (target as fabric.IText).selectAll();
                        canvas.requestRenderAll();
                        textTarget.__clickCount = 0; // Reset
                    }
                }
            }

            // Table cell selection
            if (target && ((target as any).elementType === 'table' || (target as any).type === 'table')) {
                const table = target as FabricTable;
                const pointer = canvas.getPointer(opt.e);
                const tableMatrix = table.calcTransformMatrix();
                const point = new fabric.Point(pointer.x, pointer.y);
                const localPoint = fabric.util.transformPoint(point, fabric.util.invertTransform(tableMatrix));

                const cell = table.getCellAt(localPoint.x, localPoint.y);
                if (cell) {
                    if ((opt.e as MouseEvent).shiftKey && table.activeCell) {
                        table.selectionRange = {
                            startRow: table.activeCell.row,
                            startCol: table.activeCell.col,
                            endRow: cell.row,
                            endCol: cell.col
                        };
                        table.updateLayout();
                    } else {
                        table.setActiveCell(cell.row, cell.col);
                    }
                    // Explicitly re-set selection after internal table rebuild
                    setSelection([table]);
                    useUIStore.getState().setRightPanelOpen(true);
                    canvas.requestRenderAll();
                }
            }


            // Right click (button 3)
            if ((opt.e as MouseEvent).button === 2) {
                // ... (existing context menu logic remains same) ...
                const objects = canvas.getActiveObjects();

                let items: any[] = [];

                if (!target) {
                    // Canvas background actions
                    items = [
                        {
                            label: 'Paste', action: () => {
                                const clipboard = useUIStore.getState().clipboard;
                                if (!clipboard) return;

                                clipboard.clone((clonedObj: fabric.Object) => {
                                    canvas.discardActiveObject();
                                    clonedObj.set({
                                        left: (opt.e as MouseEvent).offsetX, // Paste at cursor location
                                        top: (opt.e as MouseEvent).offsetY,
                                        evented: true,
                                    });
                                    if (clonedObj.type === 'activeSelection') {
                                        clonedObj.canvas = canvas;
                                        (clonedObj as fabric.ActiveSelection).forEachObject((obj) => {
                                            canvas.add(obj);
                                        });
                                        clonedObj.setCoords();
                                    } else {
                                        canvas.add(clonedObj);
                                    }
                                    canvas.setActiveObject(clonedObj);
                                    canvas.requestRenderAll();
                                    useUIStore.getState().addNotification({ type: 'success', message: 'Pasted', duration: 1500 });
                                });
                            }
                        },
                        { separator: true },
                        {
                            label: 'Select All', action: () => {
                                canvas.discardActiveObject();
                                const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas: canvas });
                                canvas.setActiveObject(sel);
                                canvas.requestRenderAll();
                            }
                        }
                    ];
                    useUIStore.getState().showContextMenu((opt.e as MouseEvent).clientX, (opt.e as MouseEvent).clientY, items);
                    return;
                }

                // ... (rest of context menu items)
                // Common Actions
                const commonActions = [
                    {
                        label: 'Copy', action: () => {
                            target.clone((cloned: any) => {
                                useUIStore.getState().setClipboard(cloned);
                                useUIStore.getState().addNotification({ type: 'success', message: 'Copied', duration: 1500 });
                            });
                        }
                    },
                    {
                        label: 'Duplicate', action: () => {
                            target.clone((cloned: fabric.Object) => {
                                canvas.discardActiveObject();
                                cloned.set({
                                    left: (cloned.left || 0) + 10,
                                    top: (cloned.top || 0) + 10,
                                    evented: true,
                                });
                                if (cloned.type === 'activeSelection') {
                                    cloned.canvas = canvas;
                                    (cloned as any).forEachObject((obj: any) => {
                                        canvas.add(obj);
                                    });
                                    cloned.setCoords();
                                } else {
                                    canvas.add(cloned);
                                }
                                canvas.setActiveObject(cloned);
                                canvas.requestRenderAll();
                            });
                        }
                    },
                    {
                        label: 'Delete', danger: true, action: () => {
                            const activeObjects = canvas.getActiveObjects();
                            if (activeObjects.length) {
                                canvas.discardActiveObject();
                                activeObjects.forEach((obj) => {
                                    canvas.remove(obj);
                                });
                            }
                        }
                    },
                ];

                items = [...commonActions, { separator: true }];

                if (target.type === 'image') {
                    items.push(
                        {
                            label: 'Replace Image', action: () => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        (target as fabric.Image).setSrc(ev.target?.result as string, () => {
                                            canvas.renderAll();
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                };
                                input.click();
                            }
                        },
                        { label: 'Crop', action: () => { /* Toggle Crop Mode */ } },
                        { separator: true }
                    );
                }

                if ((target as any).elementType === 'table' || target.type === 'table') {
                    const table = target as FabricTable;
                    items.push(
                        { label: 'Table Properties', action: () => useUIStore.getState().setRightPanelOpen(true) },
                        { separator: true }
                    );

                    if (table.selectionRange && (table.selectionRange.startRow !== table.selectionRange.endRow || table.selectionRange.startCol !== table.selectionRange.endCol)) {
                        items.push({ label: 'Merge Cells', action: () => table.mergeSelectedCells() });
                    }

                    if (table.activeCell) {
                        const cell = table.cells[table.activeCell.row][table.activeCell.col];
                        if (cell.rowSpan > 1 || cell.colSpan > 1) {
                            items.push({ label: 'Unmerge Cells', action: () => table.unmergeCells(table.activeCell!.row, table.activeCell!.col) });
                        }
                    }
                    items.push({ separator: true });
                }

                if (target.type === 'textbox' || target.type === 'text' || target.type === 'i-text') {
                    items.unshift(
                        {
                            label: 'Edit Text',
                            action: () => {
                                (target as fabric.IText).enterEditing();
                                canvas.requestRenderAll();
                            }
                        },
                        { separator: true }
                    );

                    items.push(
                        { separator: true },
                        { label: 'Text Properties', action: () => useUIStore.getState().setRightPanelOpen(true) },
                    );
                }

                items.push(
                    { label: 'Bring to Front', action: () => { target.bringToFront(); canvas.renderAll(); } },
                    { label: 'Send to Back', action: () => { target.sendToBack(); canvas.renderAll(); } },
                    { label: 'Bring Forward', action: () => { target.bringForward(); canvas.renderAll(); } },
                    { label: 'Send Backward', action: () => { target.sendBackwards(); canvas.renderAll(); } },
                    { separator: true }
                );

                if (objects.length > 1) {
                    items.push(
                        {
                            label: 'Group Selection', action: () => {
                                if (!canvas.getActiveObject()) return;
                                if (canvas.getActiveObject()?.type !== 'activeSelection') return;
                                (canvas.getActiveObject() as fabric.ActiveSelection).toGroup();
                                canvas.requestRenderAll();
                            }
                        }
                    );
                } else if (target.type === 'group' && (target as any).elementType !== 'table') {
                    items.push(
                        {
                            label: 'Ungroup', action: () => {
                                (target as fabric.Group).toActiveSelection();
                                canvas.requestRenderAll();
                            }
                        }
                    );
                }

                items.push(
                    {
                        label: target.lockMovementX ? 'Unlock' : 'Lock', action: () => {
                            const newVal = !target.lockMovementX;
                            target.set({
                                lockMovementX: newVal,
                                lockMovementY: newVal,
                                lockRotation: newVal,
                                lockScalingX: newVal,
                                lockScalingY: newVal
                            });
                            canvas.requestRenderAll();
                        }
                    }
                );

                items.push(
                    {
                        label: target.visible ? 'Hide' : 'Show', action: () => {
                            target.visible = !target.visible;
                            if (!target.visible) canvas.discardActiveObject();
                            canvas.requestRenderAll();
                        }
                    }
                );

                if (target.type === 'image') {
                    items.push({ separator: true });
                    items.push(
                        {
                            label: 'Make Grayscale', action: () => {
                                (target as fabric.Image).filters?.push(new fabric.Image.filters.Grayscale());
                                (target as fabric.Image).applyFilters();
                                canvas.renderAll();
                            }
                        }
                    );
                }

                useUIStore.getState().showContextMenu((opt.e as MouseEvent).clientX, (opt.e as MouseEvent).clientY, items);

            } else {
                useUIStore.getState().hideContextMenu();
            }
        };

        const handleMouseOver = (e: fabric.IEvent) => {
            const target = e.target;
            // Only show hover effect if not currently selected and not active
            if (target && !canvas.getActiveObjects().includes(target)) {
                // @ts-ignore - Store original border color
                target.__originalBorderColor = target.borderColor;
                // @ts-ignore
                target.__originalBorderDash = target.borderDashArray;

                // Apply Hover Style: Light Blue Dashed
                target.set({
                    borderColor: '#93C5FD', // Light blue
                    borderDashArray: [4, 4],
                    borderOpacityWhenMoving: 0.5,
                });
                canvas.requestRenderAll();
            }

            // Mail Merge Tooltip
            // @ts-ignore
            if (target && target.isMailMerge) {
                // @ts-ignore
                const binding = target.fieldBinding;
                // @ts-ignore
                const type = target.elementType === 'mailmerge-image-placeholder' ? 'Image' : 'Text';

                const mouseEvent = e.e as MouseEvent;
                if (mouseEvent) {
                    setInteractionTooltip({
                        visible: true,
                        left: mouseEvent.clientX,
                        top: mouseEvent.clientY - 20,
                        text: `${type} Field: {{${binding}}}`
                    });
                }
            }
        };

        const handleMouseOut = (e: fabric.IEvent) => {
            const target = e.target;
            if (target) {
                // Restore original style
                // @ts-ignore
                const origColor = target.__originalBorderColor || '#3B82F6';
                // @ts-ignore
                const origDash = target.__originalBorderDash || undefined;

                target.set({
                    borderColor: origColor,
                    borderDashArray: origDash
                });

                // If it became active during hover (e.g. slight drag), ensure it has selection style
                if (canvas.getActiveObjects().includes(target)) {
                    target.set({
                        borderColor: '#3B82F6',
                        borderDashArray: undefined // Solid for selected
                    });
                }

                canvas.requestRenderAll();
            }
            setInteractionTooltip(null);
        };

        const handleDoubleClick = (e: fabric.IEvent) => {
            const target = e.target;
            if (target && (target.type === 'i-text' || target.type === 'textbox')) {
                const textObj = target as fabric.IText;
                textObj.enterEditing();
                canvas.requestRenderAll();
            } else if (target && ((target as any).elementType === 'table' || target.type === 'table')) {
                const table = target as FabricTable;
                const pointer = canvas.getPointer(e.e);
                const tableMatrix = table.calcTransformMatrix();
                const point = new fabric.Point(pointer.x, pointer.y);
                const localPoint = fabric.util.transformPoint(point, fabric.util.invertTransform(tableMatrix));

                const cell = table.getCellAt(localPoint.x, localPoint.y);
                if (cell) {
                    table.enterCellEditing(cell.row, cell.col);
                }
            }
        };

        const handleMouseMove = (e: fabric.IEvent) => {
            // Handle Resizing
            if (resizingStateRef.current) {
                const { table, type, index, startVal, startMouse } = resizingStateRef.current;
                const pointer = canvas.getPointer(e.e);

                if (type === 'col') {
                    const scaleX = table.scaleX || 1;
                    const delta = (pointer.x - startMouse) / scaleX;
                    table.resizeColumn(index, startVal + delta);
                } else {
                    const scaleY = table.scaleY || 1;
                    const delta = (pointer.y - startMouse) / scaleY;
                    table.resizeRow(index, startVal + delta);
                }
                canvas.requestRenderAll();
                return;
            }

            // Cursor updates
            const target = e.target;
            if (target && ((target as any).elementType === 'table' || target.type === 'table')) {
                const table = target as FabricTable;
                const pointer = canvas.getPointer(e.e);
                const tableMatrix = table.calcTransformMatrix();
                const point = new fabric.Point(pointer.x, pointer.y);
                const localPoint = fabric.util.transformPoint(point, fabric.util.invertTransform(tableMatrix));

                const divider = table.getDividerAt(localPoint.x, localPoint.y);
                if (divider) {
                    canvas.defaultCursor = divider.type === 'col' ? 'col-resize' : 'row-resize';
                    canvas.hoverCursor = divider.type === 'col' ? 'col-resize' : 'row-resize';
                } else {
                    canvas.defaultCursor = 'default';
                    canvas.hoverCursor = 'move';
                }
            } else {
                canvas.defaultCursor = 'default';
            }
        };

        const handleMouseDownGeneric = (e: fabric.IEvent) => {
            const target = e.target;
            if (target && ((target as any).elementType === 'table' || target.type === 'table')) {
                const table = target as FabricTable;
                const pointer = canvas.getPointer(e.e);
                const tableMatrix = table.calcTransformMatrix();
                const point = new fabric.Point(pointer.x, pointer.y);
                const localPoint = fabric.util.transformPoint(point, fabric.util.invertTransform(tableMatrix));

                const divider = table.getDividerAt(localPoint.x, localPoint.y);
                if (divider) {
                    // Start resizing
                    resizingStateRef.current = {
                        table,
                        type: divider.type,
                        index: divider.index,
                        startVal: divider.type === 'col' ? table.columnWidths[divider.index] : table.rowHeights[divider.index],
                        startMouse: divider.type === 'col' ? pointer.x : pointer.y
                    };
                    table.lockMovementX = true;
                    table.lockMovementY = true;
                }
            }
        }

        const handleMouseUpGeneric = () => {
            if (resizingStateRef.current) {
                const { table } = resizingStateRef.current;
                table.lockMovementX = false;
                table.lockMovementY = false;
                resizingStateRef.current = null;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
            }
        };

        canvas.on('mouse:dblclick', handleDoubleClick);

        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:down', handleMouseDownGeneric);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUpGeneric);
            canvas.off('mouse:over', handleMouseOver);
            canvas.off('mouse:out', handleMouseOut);
            canvas.off('mouse:dblclick', handleDoubleClick);
        };
    }, [canvas, setSelection, zoom]);

    // Object modification events (for history)
    useEffect(() => {
        if (!canvas) return;

        // Save initial state when canvas is ready
        const { saveInitialState, addToHistory } = useHistoryStore.getState();

        // Small delay to ensure canvas is fully initialized
        const initTimer = setTimeout(() => {
            saveInitialState();
        }, 100);

        // Debounce timer for history
        let historyTimer: NodeJS.Timeout | null = null;
        const DEBOUNCE_MS = 300;

        const saveHistory = (action: string) => {
            if (historyTimer) clearTimeout(historyTimer);
            historyTimer = setTimeout(() => {
                addToHistory(action, canvas.toJSON());
            }, DEBOUNCE_MS);
        };

        const handleObjectModified = (e: fabric.IEvent) => {
            saveHistory(`Modified ${e.target?.type || 'object'}`);
        };

        const handleObjectAdded = (e: fabric.IEvent) => {
            saveHistory(`Added ${e.target?.type || 'object'}`);
        };

        const handleObjectRemoved = (e: fabric.IEvent) => {
            saveHistory(`Removed ${e.target?.type || 'object'}`);
        };

        canvas.on('object:modified', handleObjectModified);
        canvas.on('object:added', handleObjectAdded);
        canvas.on('object:removed', handleObjectRemoved);

        return () => {
            clearTimeout(initTimer);
            if (historyTimer) clearTimeout(historyTimer);
            canvas.off('object:modified', handleObjectModified);
            canvas.off('object:added', handleObjectAdded);
            canvas.off('object:removed', handleObjectRemoved);
        };
    }, [canvas]);

    // Snap to grid implementation
    useEffect(() => {
        if (!canvas || !snapToGrid) return;

        const handleMoving = (e: fabric.IEvent) => {
            const obj = e.target;
            if (!obj) return;

            const left = Math.round((obj.left || 0) / gridSize) * gridSize;
            const top = Math.round((obj.top || 0) / gridSize) * gridSize;

            obj.set({ left, top });
        };

        canvas.on('object:moving', handleMoving);

        return () => {
            canvas.off('object:moving', handleMoving);
        };
    }, [canvas, snapToGrid, gridSize]);

    // Tooltip State for feedback
    const [interactionTooltip, setInteractionTooltip] = React.useState<{ visible: boolean, left: number, top: number, text: string } | null>(null);
    const activeGuidesRef = React.useRef<{ x?: number, y?: number, type: 'vertical' | 'horizontal' }[]>([]);

    // Smart Guides & Visual Snapping
    useEffect(() => {
        if (!canvas) return;

        const ctx = canvas.getSelectionContext();

        // Draw guides on top of everything
        const handleAfterRender = () => {
            if (activeGuidesRef.current.length > 0) {
                const ctx = canvas.getContext();
                if (!ctx) return;

                // Use viewportTransform property directly (works even if method is unavailable)
                const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

                ctx.save();
                ctx.strokeStyle = '#EC4899'; // Magenta
                ctx.lineWidth = 1;
                ctx.beginPath();

                activeGuidesRef.current.forEach(guide => {
                    if (guide.type === 'vertical' && guide.x !== undefined) {
                        const x = fabric.util.transformPoint(
                            new fabric.Point(guide.x, 0),
                            vpt
                        ).x;

                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, canvas.height || 0);
                    } else if (guide.type === 'horizontal' && guide.y !== undefined) {
                        const y = fabric.util.transformPoint(
                            new fabric.Point(0, guide.y),
                            vpt
                        ).y;

                        ctx.moveTo(0, y);
                        ctx.lineTo(canvas.width || 0, y);
                    }
                });

                ctx.stroke();
            }
        };

        canvas.on('after:render', handleAfterRender);

        return () => {
            canvas.off('after:render', handleAfterRender);
        };
    }, [canvas]);

    // Enhanced Snapping with Visuals
    useEffect(() => {
        if (!canvas || !snapToObjects) return;

        const handleMoving = (e: fabric.IEvent) => {
            const obj = e.target;
            if (!obj) return;

            const snapThreshold = 5;
            const objects = canvas.getObjects().filter(o => o !== obj && o.visible);

            // Clear previous guides
            activeGuidesRef.current = [];

            let snapped = false;

            objects.forEach(otherObj => {
                // Vertical Snapping (Left, Center, Right)
                const objWidth = (obj.width || 0) * (obj.scaleX || 1);
                const otherWidth = (otherObj.width || 0) * (otherObj.scaleX || 1);

                const objLeft = obj.left || 0;
                const otherLeft = otherObj.left || 0;

                const objCenter = objLeft + objWidth / 2;
                const otherCenter = otherLeft + otherWidth / 2;

                const objRight = objLeft + objWidth;
                const otherRight = otherLeft + otherWidth;

                // Helper to snap X
                const snapX = (targetVal: number, snapToVal: number) => {
                    if (Math.abs(targetVal - snapToVal) < snapThreshold) {
                        obj.set({ left: obj.left! + (snapToVal - targetVal) });
                        activeGuidesRef.current.push({ x: snapToVal, type: 'vertical' });
                        snapped = true;
                    }
                };

                // Snap Left to Left, Left to Right, etc.
                snapX(objLeft, otherLeft);
                snapX(objLeft, otherRight);
                snapX(objLeft, otherCenter);

                snapX(objRight, otherLeft);
                snapX(objRight, otherRight);
                snapX(objRight, otherCenter);

                snapX(objCenter, otherLeft);
                snapX(objCenter, otherRight);
                snapX(objCenter, otherCenter);

                // Horizontal Snapping (Top, Center, Bottom)
                const objHeight = (obj.height || 0) * (obj.scaleY || 1);
                const otherHeight = (otherObj.height || 0) * (otherObj.scaleY || 1);

                const objTop = obj.top || 0;
                const otherTop = otherObj.top || 0;

                const objCenterY = objTop + objHeight / 2;
                const otherCenterY = otherTop + otherHeight / 2;

                const objBottom = objTop + objHeight;
                const otherBottom = otherTop + otherHeight;

                const snapY = (targetVal: number, snapToVal: number) => {
                    if (Math.abs(targetVal - snapToVal) < snapThreshold) {
                        obj.set({ top: obj.top! + (snapToVal - targetVal) });
                        activeGuidesRef.current.push({ y: snapToVal, type: 'horizontal' });
                        snapped = true;
                    }
                };

                snapY(objTop, otherTop);
                snapY(objTop, otherBottom);
                snapY(objTop, otherCenterY);

                snapY(objBottom, otherTop);
                snapY(objBottom, otherBottom);
                snapY(objBottom, otherCenterY);

                snapY(objCenterY, otherTop);
                snapY(objCenterY, otherBottom);
                snapY(objCenterY, otherCenterY);

            });

            // Additional Global Snaps (Center of Canvas)
            if (canvas.width && canvas.height) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const objWidth = (obj.width || 0) * (obj.scaleX || 1);
                const objHeight = (obj.height || 0) * (obj.scaleY || 1);

                // Snap Centers
                if (Math.abs((obj.left || 0) + objWidth / 2 - centerX) < snapThreshold) {
                    obj.set({ left: centerX - objWidth / 2 });
                    activeGuidesRef.current.push({ x: centerX, type: 'vertical' });
                }
                if (Math.abs((obj.top || 0) + objHeight / 2 - centerY) < snapThreshold) {
                    obj.set({ top: centerY - objHeight / 2 });
                    activeGuidesRef.current.push({ y: centerY, type: 'horizontal' });
                }
            }

            if (!snapped && activeGuidesRef.current.length === 0) {
                // No guides
            }

            // Update tooltip for position
            const pointer = canvas.getPointer(e.e);
            setInteractionTooltip({
                visible: true,
                left: pointer.x * (zoom / 100) + margins.left + 20, // Offset
                top: pointer.y * (zoom / 100) + margins.top + 20,
                text: `X: ${Math.round(obj.left || 0)} Y: ${Math.round(obj.top || 0)}`
            });

            canvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            activeGuidesRef.current = [];
            setInteractionTooltip(null);
            canvas.requestRenderAll();
        };

        canvas.on('object:moving', handleMoving);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('object:moving', handleMoving);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [canvas, snapToObjects, zoom, margins]);

    // Rotation & Scaling Tooltips
    useEffect(() => {
        if (!canvas) return;

        const handleRotating = (e: fabric.IEvent) => {
            const obj = e.target;
            if (!obj) return;

            // Normalize angle 0-360
            let angle = (obj.angle || 0) % 360;
            if (angle < 0) angle += 360;

            const pointer = canvas.getPointer(e.e);
            setInteractionTooltip({
                visible: true,
                left: pointer.x * (zoom / 100) + 20,
                top: pointer.y * (zoom / 100) + 20,
                text: `${Math.round(angle)}°`
            });
        };

        const handleScaling = (e: fabric.IEvent) => {
            const obj = e.target;
            if (!obj) return;

            const w = Math.round((obj.width || 0) * (obj.scaleX || 1));
            const h = Math.round((obj.height || 0) * (obj.scaleY || 1));

            const pointer = canvas.getPointer(e.e);
            setInteractionTooltip({
                visible: true,
                left: pointer.x * (zoom / 100) + 20,
                top: pointer.y * (zoom / 100) + 20,
                text: `${w} × ${h} px`
            });
        };

        const handleActionEnd = () => {
            setInteractionTooltip(null);
        };

        canvas.on('object:rotating', handleRotating);
        canvas.on('object:scaling', handleScaling);
        canvas.on('mouse:up', handleActionEnd);

        return () => {
            canvas.off('object:rotating', handleRotating);
            canvas.off('object:scaling', handleScaling);
            canvas.off('mouse:up', handleActionEnd);
        };
    }, [canvas, zoom]);

    // Render watermark
    useEffect(() => {
        if (!canvas || !watermark.enabled) return;
        // ... (existing watermark logic)
    }, [canvas, watermark]);

    // Preview Mode Logic
    useEffect(() => {
        if (!canvas) return;

        if (isPreviewMode) {
            const rowData = (filteredRows && filteredRows.length > 0) ? filteredRows[previewRecordIndex] || {} : {};

            canvas.getObjects().forEach((obj: any) => {
                // Process text objects
                if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                    const currentText = obj.text || '';

                    // Initialize originalText if not present and text looks like a placeholder
                    // We check for {{ to ensure we don't accidentally capture non-placeholder text as "original" 
                    // unless we are already in a state where we might have mixed content.
                    // Ideally, we capture it if it has {{ OR if we previously marked it.
                    if (!obj.originalText && currentText.includes('{{')) {
                        obj.originalText = currentText;
                    }

                    // If we have an original text (placeholder), try to replace it
                    if (obj.originalText) {
                        const newText = obj.originalText.replace(/\{\{([^}]+)\}\}/g, (match: string, placeholderName: string) => {
                            const columnName = mappings[placeholderName];
                            // If we have a mapping and data for it
                            if (columnName && rowData[columnName] !== undefined) {
                                return String(rowData[columnName]);
                            }
                            // Fallback: keep placeholder
                            return match;
                        });

                        if (obj.text !== newText) {
                            obj.set('text', newText);
                        }
                    }
                }
            });
            canvas.requestRenderAll();
        } else {
            // Exit Preview Mode: Restore original text
            let needsRender = false;
            canvas.getObjects().forEach((obj: any) => {
                if (obj.originalText) {
                    obj.set('text', obj.originalText);
                    delete obj.originalText;
                    needsRender = true;
                }
            });
            if (needsRender) {
                canvas.requestRenderAll();
            }
        }
    }, [canvas, isPreviewMode, previewRecordIndex, filteredRows, mappings]);

    // ... (existing preview logic) ...

    return (
        <div className="canvas-workspace" ref={containerRef}>
            {/* Canvas Scroll Area - No Rulers */}
            <div className="canvas-scroll-area">
                {/* Canvas Container with Shadow */}
                <div
                    className="canvas-container"
                    style={{ transform: `scale(${zoom / 100})` }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        // Use window.canvas to avoid React stale closure issue
                        const dropCanvas = (window as any).canvas as fabric.Canvas;
                        if (!dropCanvas) return;

                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const scale = zoom / 100;
                        const x = (e.clientX - rect.left) / scale;
                        const y = (e.clientY - rect.top) / scale;

                        // 1. Handle Text Library Drops
                        let jsonData = e.dataTransfer.getData('application/json');
                        if (!jsonData) {
                            jsonData = e.dataTransfer.getData('text/plain');
                        }

                        if (jsonData && jsonData.trim().startsWith('{"')) {
                            try {
                                const item = JSON.parse(jsonData);
                                if (item.type === 'text') {
                                    let textContent = item.text || 'Text';

                                    // Handle dynamic content
                                    if (item.stitchType === 'dynamic-date') {
                                        textContent = new Date().toLocaleDateString();
                                    }

                                    const fontFamily = item.fontFamily || 'Arial';
                                    const fontSize = item.fontSize || 16;

                                    const textbox = new fabric.Textbox(textContent, {
                                        left: x,
                                        top: y,
                                        width: item.width || 300,
                                        fontFamily: fontFamily,
                                        fontSize: fontSize,
                                        fontWeight: String(item.fontWeight || 'normal'),
                                        fill: item.fill || '#000000',
                                        textAlign: item.textAlign || 'left',
                                        lineHeight: item.lineHeight,
                                        charSpacing: item.charSpacing,
                                        fontStyle: item.fontStyle || 'normal',
                                        underline: item.underline || false,
                                    });

                                    dropCanvas.add(textbox);
                                    dropCanvas.setActiveObject(textbox);
                                    dropCanvas.requestRenderAll();

                                    // Re-render after fonts finish loading to fix any font issues
                                    document.fonts.ready.then(() => {
                                        dropCanvas.requestRenderAll();
                                    });

                                    // History
                                    useHistoryStore.getState().addToHistory('Added text', dropCanvas.toJSON());
                                    return;
                                }

                                if (item.type === 'table') {
                                    const table = new FabricTable({
                                        rows: item.rows,
                                        columns: item.cols,
                                        ...item.options,
                                        left: x,
                                        top: y,
                                        originX: 'center',
                                        originY: 'center',
                                    });

                                    dropCanvas.add(table);
                                    dropCanvas.setActiveObject(table);
                                    dropCanvas.requestRenderAll();

                                    // Explicitly set selection so the properties panel opens
                                    setSelection([table]);
                                    useUIStore.getState().setRightPanelOpen(true);

                                    // History
                                    useHistoryStore.getState().addToHistory('Added table', dropCanvas.toJSON());
                                    return;
                                }
                            } catch (err) {
                                console.error('Failed to parse dropped JSON', err);
                            }
                        }

                        // 1.5 Handle Mail Merge Field Drops
                        const mailMergeField = e.dataTransfer.getData('application/mailmerge-field');
                        const mailMergeType = e.dataTransfer.getData('application/mailmerge-field-type');

                        if (mailMergeField) {
                            if (mailMergeType === 'image') {
                                // Create violet image placeholder
                                const placeholderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                        <rect fill="#ede9fe" width="200" height="200" stroke="#8b5cf6" stroke-width="2" />
                                        <text x="100" y="100" font-family="Arial" font-size="24" fill="#7c3aed" text-anchor="middle" dominant-baseline="middle">📷</text>
                                        <text x="100" y="140" font-family="Arial" font-size="14" fill="#6d28d9" text-anchor="middle" font-weight="bold">{{${mailMergeField}}}</text>
                                    </svg>
                                `)}`;

                                fabric.Image.fromURL(placeholderSvg, (img) => {
                                    img.set({
                                        left: x,
                                        top: y,
                                        // @ts-ignore
                                        elementType: 'mailmerge-image-placeholder',
                                        fieldBinding: mailMergeField,
                                        isMailMerge: true,
                                    });
                                    dropCanvas.add(img);
                                    dropCanvas.setActiveObject(img);
                                    dropCanvas.renderAll();
                                });
                            } else {
                                const text = new fabric.IText(`{{${mailMergeField}}}`, {
                                    left: x,
                                    top: y,
                                    fontSize: 24,
                                    fill: '#5b21b6', // Violet-800
                                    backgroundColor: '#ede9fe', // Violet-100
                                    fontFamily: 'Arial',
                                    padding: 8,
                                    // Custom properties for mail merge
                                    // @ts-ignore
                                    elementType: 'mailmerge-field',
                                    fieldBinding: mailMergeField,
                                    isMailMerge: true,
                                });

                                dropCanvas.add(text);
                                text.bringToFront();
                                dropCanvas.setActiveObject(text);
                                dropCanvas.renderAll();
                            }
                            return;
                        }

                        // 2. Handle Data Column Drops (Unified Logic)
                        const columnName = e.dataTransfer.getData('application/x-canva-column');
                        const columnType = e.dataTransfer.getData('application/x-canva-column-type') || 'string';

                        if (columnName) {
                            // Fallback for legacy drag data if any, converting to mail merge format
                            const text = new fabric.IText(`{{${columnName.trim()}}}`, {
                                left: x,
                                top: y,
                                fontSize: 24,
                                fill: '#5b21b6',
                                backgroundColor: '#ede9fe',
                                fontFamily: 'Arial',
                                padding: 8,
                                // @ts-ignore
                                elementType: 'mailmerge-field',
                                fieldBinding: columnName.trim(),
                                isMailMerge: true,
                            });

                            dropCanvas.add(text);
                            dropCanvas.setActiveObject(text);
                            dropCanvas.renderAll();
                        }
                    }}
                >
                    <canvas ref={canvasRef} id="template-canvas" />

                    {/* Grid Overlay */}
                    {showGrid && <CanvasGrid />}

                    {/* Guides Overlay */}
                    {showGuides && <CanvasGuides />}

                    {/* Interaction Tooltip */}
                    {interactionTooltip && interactionTooltip.visible && (
                        <div
                            style={{
                                position: 'fixed', // Use fixed to be relative to screen, avoiding zoom scaling issues if careful
                                // Actually, absolute parent is better if we handled zoom. 
                                // But container has scale transform, so 'absolute' inside here will be scaled.
                                // Let's use absolute and inverse scale if needed, or just let it scale.
                                // Spec says "Tooltip... Positioned near cursor".
                                // If we put it here, it will scale with canvas. That's usually fine.
                                left: interactionTooltip.left,
                                top: interactionTooltip.top,
                                background: '#1F2937',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                pointerEvents: 'none',
                                whiteSpace: 'nowrap',
                                zIndex: 1000,
                                transform: `translate(-50%, -100%) scale(${100 / zoom})`, // Counter-scale to keep text readable
                                marginTop: '-10px'
                            }}
                        >
                            {interactionTooltip.text}
                        </div>
                    )}

                    {/* Margin Indicators */}
                    <div
                        className="margin-indicator"
                        style={{
                            top: `${margins.top}px`,
                            right: `${margins.right}px`,
                            bottom: `${margins.bottom}px`,
                            left: `${margins.left}px`,
                        }}
                    />

                    {/* Preview Mode Controls */}
                    <div className="preview-controls-overlay" style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '10px',
                        padding: '8px 16px',
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: '24px',
                        zIndex: 1000,
                        alignItems: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isPreviewMode}
                                onChange={() => useMailMergeStore.getState().togglePreviewMode()}
                                style={{ accentColor: '#00C4CC' }}
                            />
                            <span>Preview Data</span>
                        </label>

                        {isPreviewMode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #555', paddingLeft: '10px', marginLeft: '5px' }}>
                                <button
                                    onClick={() => useMailMergeStore.getState().setPreviewRecordIndex(previewRecordIndex - 1)}
                                    disabled={previewRecordIndex <= 0}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}
                                >
                                    ◀
                                </button>
                                <span style={{ color: 'white', fontSize: '12px', minWidth: '60px', textAlign: 'center' }}>
                                    Row {previewRecordIndex + 1}
                                </span>
                                <button
                                    onClick={() => useMailMergeStore.getState().setPreviewRecordIndex(previewRecordIndex + 1)}
                                    disabled={previewRecordIndex >= (filteredRows?.length || 0) - 1}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}
                                >
                                    ▶
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
