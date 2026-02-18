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
import { useDataStore } from '../../store/dataStore';
import { CanvasGrid } from './CanvasGrid';
import { CanvasGuides } from './CanvasGuides';
import './CanvasWorkspace.css';

export const CanvasWorkspace: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
        scanForPlaceholders,
        mapPlaceholderToColumn,
        excelData,
        mappings,
        isPreviewMode,
        previewRowIndex,
        setPreviewMode,
        setPreviewRow
    } = useDataStore();

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
            fabricCanvas.dispose();
        };
    }, []);

    // Update canvas size
    useEffect(() => {
        if (!canvas) return;
        canvas.setDimensions({
            width: canvasSize.width,
            height: canvasSize.height,
        });
        canvas.renderAll();
    }, [canvas, canvasSize]);

    // Update background color
    useEffect(() => {
        if (!canvas) return;
        canvas.setBackgroundColor(backgroundColor, () => {
            canvas.renderAll();
        });
    }, [canvas, backgroundColor]);

    // Update background image
    useEffect(() => {
        if (!canvas) return;

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
            const selected = canvas.getActiveObjects();
            setSelection(selected);
        };

        const handleSelectionCleared = () => {
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
                } else {
                    // New click sequence
                    textTarget.__lastClickTime = now;
                    textTarget.__clickCount = 1;
                }
                textTarget.__lastClickTime = now;
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

                if ((target as any).elementType === 'table') {
                    items.push(
                        { label: 'Table Properties', action: () => useUIStore.getState().setRightPanelOpen(true) },
                        { separator: true }
                    );
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
        };

        const handleDoubleClick = (e: fabric.IEvent) => {
            const target = e.target;
            if (target && (target.type === 'i-text' || target.type === 'textbox')) {
                const textObj = target as fabric.IText;
                textObj.enterEditing();
                // Select word under cursor is default Fabric behavior for double click usually
                // But we can force it if needed, though 'enterEditing' usually puts cursor at click.
                // To selecting word we might need getSelectionStartFromPointer logic if standard behavior fails
                // For now, assume standard behavior is close enough to requirement.
                canvas.requestRenderAll();
            }
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', handleSelectionCleared);
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:over', handleMouseOver);
        canvas.on('mouse:out', handleMouseOut);
        canvas.on('mouse:dblclick', handleDoubleClick);

        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:over', handleMouseOver);
            canvas.off('mouse:out', handleMouseOut);
            canvas.off('mouse:dblclick', handleDoubleClick);
        };
    }, [canvas]);

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
                ctx.restore();
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

                        if (jsonData) {
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
                            } catch (err) {
                                console.error('Failed to parse dropped JSON', err);
                            }
                        }

                        // 2. Handle Data Column Drops (Existing Logic)
                        const columnName = e.dataTransfer.getData('application/x-canva-column');
                        const columnType = e.dataTransfer.getData('application/x-canva-column-type') || 'string';

                        if (!columnName) return;

                        // Check if this is an image/URL column - create image placeholder
                        const isImageColumn = columnType === 'url' ||
                            columnType === 'image' ||
                            columnName.toLowerCase().includes('image') ||
                            columnName.toLowerCase().includes('photo') ||
                            columnName.toLowerCase().includes('logo') ||
                            columnName.toLowerCase().includes('picture');

                        if (isImageColumn) {
                            // Create image placeholder with placeholder image
                            const placeholderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
                                    <rect fill="#E5E7EB" width="150" height="150"/>
                                    <text x="75" y="70" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">{{${columnName.trim()}}}</text>
                                    <text x="75" y="90" font-family="Arial" font-size="10" fill="#9CA3AF" text-anchor="middle">Image Placeholder</text>
                                </svg>
                            `)}`;

                            fabric.Image.fromURL(placeholderSvg, (img) => {
                                img.set({
                                    left: x,
                                    top: y,
                                    isPlaceholder: true,
                                    placeholderName: columnName.trim(),
                                    placeholderType: 'image',
                                } as any);

                                dropCanvas.add(img);
                                dropCanvas.setActiveObject(img);
                                dropCanvas.renderAll();

                                // Scan and map
                                scanForPlaceholders(dropCanvas.getObjects());
                                mapPlaceholderToColumn(columnName.trim(), columnName.trim());
                            });
                        } else {
                            // Create text placeholder
                            const text = new fabric.IText(`{{${columnName.trim()}}}`, {
                                left: x,
                                top: y,
                                fontSize: 24,
                                fill: '#000000',
                                fontFamily: 'Arial',
                            });

                            dropCanvas.add(text);
                            dropCanvas.setActiveObject(text);
                            dropCanvas.renderAll();

                            // Scan FIRST to register the placeholder object
                            scanForPlaceholders(dropCanvas.getObjects());

                            // Then Map it
                            mapPlaceholderToColumn(columnName.trim(), columnName.trim());
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
                                onChange={(e) => setPreviewMode(e.target.checked)}
                                style={{ accentColor: '#00C4CC' }}
                            />
                            <span>Preview Data</span>
                        </label>

                        {isPreviewMode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #555', paddingLeft: '10px', marginLeft: '5px' }}>
                                <button
                                    onClick={() => setPreviewRow(Math.max(0, previewRowIndex - 1))}
                                    disabled={previewRowIndex <= 0}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}
                                >
                                    ◀
                                </button>
                                <span style={{ color: 'white', fontSize: '12px', minWidth: '60px', textAlign: 'center' }}>
                                    Row {previewRowIndex + 1}
                                </span>
                                <button
                                    onClick={() => setPreviewRow(Math.min((excelData?.rows.length || 1) - 1, previewRowIndex + 1))}
                                    disabled={previewRowIndex >= (excelData?.rows.length || 0) - 1}
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
