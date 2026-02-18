import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { ElementFactory } from '../../utils/elementFactory';
import { StitchButton } from '../common/StitchButton';
import { StitchSlider } from '../common/StitchSlider';
import {
    Image as ImageIcon, Crop, MoveHorizontal, MoveVertical, RotateCcw, RotateCw,
    Filter, Sliders, Trash2, Copy, Lock, Unlock, RefreshCw, Sun, Moon, Droplet,
    ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

export const ImageRibbon: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();

    // State for image properties
    const [opacity, setOpacity] = useState(100);
    const [isLocked, setIsLocked] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);

    // Adjustment values
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);

    useEffect(() => {
        if (selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
            const obj = selectedObjects[0] as fabric.Image;
            setOpacity(Math.round((obj.opacity || 1) * 100));
            setIsLocked(!!obj.lockMovementX);

            // Reset adjustment values when selecting new image
            setBrightness(0);
            setContrast(0);
            setSaturation(0);
        }
    }, [selectedObjects]);

    const getImg = () => {
        if (canvas && selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
            return selectedObjects[0] as fabric.Image;
        }
        return null;
    };

    const handleReplace = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file || !canvas) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgObj = getImg();
                if (!imgObj) return;
                imgObj.setSrc(ev.target?.result as string, () => {
                    if (canvas) ElementFactory.scaleImageToFit(imgObj, canvas.getWidth(), canvas.getHeight());
                    imgObj.setCoords();
                    canvas.requestRenderAll();
                }, { crossOrigin: 'anonymous' });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    // Direct flip actions
    const handleFlipHorizontal = () => {
        const img = getImg();
        if (!img) return;
        img.set('flipX', !img.flipX);
        canvas?.renderAll();
    };

    const handleFlipVertical = () => {
        const img = getImg();
        if (!img) return;
        img.set('flipY', !img.flipY);
        canvas?.renderAll();
    };

    // Direct rotate actions
    const handleRotate90CW = () => {
        const img = getImg();
        if (!img) return;
        img.rotate((img.angle || 0) + 90);
        canvas?.renderAll();
    };

    const handleRotate90CCW = () => {
        const img = getImg();
        if (!img) return;
        img.rotate((img.angle || 0) - 90);
        canvas?.renderAll();
    };

    const handleOpacity = (val: number) => {
        const img = getImg();
        if (!img) return;
        img.set('opacity', val / 100);
        setOpacity(val);
        canvas?.renderAll();
    };

    const handleDelete = () => {
        const img = getImg();
        if (!img || !canvas) return;
        canvas.remove(img);
        canvas.discardActiveObject();
        canvas.renderAll();
    };

    const handleDuplicate = () => {
        const img = getImg();
        if (!img || !canvas) return;
        img.clone((cloned: fabric.Image) => {
            cloned.set({
                left: (img.left || 0) + 20,
                top: (img.top || 0) + 20,
                evented: true
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
        });
    };

    const handleLock = () => {
        const img = getImg();
        if (!img) return;
        const newLockState = !isLocked;
        img.set({
            lockMovementX: newLockState,
            lockMovementY: newLockState,
            lockRotation: newLockState,
            lockScalingX: newLockState,
            lockScalingY: newLockState,
            hasControls: !newLockState,
            hasBorders: !newLockState,
        });
        setIsLocked(newLockState);
        canvas?.renderAll();
    };

    const handleReset = () => {
        const img = getImg();
        if (!img) return;
        img.filters = [];
        img.applyFilters();
        img.set({
            opacity: 1,
            flipX: false,
            flipY: false,
            angle: 0,
        });
        if (canvas) ElementFactory.scaleImageToFit(img, canvas.getWidth(), canvas.getHeight());
        img.setCoords();
        canvas?.renderAll();
        setOpacity(100);
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
    };

    // Filter presets - Disable WebGL to prevent clipping issues
    const applyFilter = (filterType: string) => {
        const img = getImg();
        if (!img || !canvas) return;

        // CRITICAL: Disable WebGL filtering to prevent image clipping
        (fabric as any).filterBackend = new fabric.Canvas2dFilterBackend();
        (fabric as any).textureSize = 8192;
        img.objectCaching = false;

        // Store all current properties
        const savedProps = {
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            originX: img.originX,
            originY: img.originY,
        };

        // Initialize and clear filters
        if (!img.filters) img.filters = [];
        img.filters = [];

        // Add the selected filter
        switch (filterType) {
            case 'grayscale':
                img.filters.push(new fabric.Image.filters.Grayscale());
                break;
            case 'sepia':
                img.filters.push(new fabric.Image.filters.Sepia());
                break;
            case 'invert':
                img.filters.push(new fabric.Image.filters.Invert());
                break;
            case 'blur':
                img.filters.push(new fabric.Image.filters.Blur({ blur: 0.1 }));
                break;
            case 'vintage':
                img.filters.push(new fabric.Image.filters.Sepia());
                img.filters.push(new fabric.Image.filters.Brightness({ brightness: -0.1 }));
                break;
            // 'none' case is handled by clearing filters above
        }

        img.applyFilters();
        img.set(savedProps);
        img.setCoords();

        canvas.requestRenderAll();
        setShowFilters(false);
    };

    // Adjustment handlers
    const handleBrightness = (val: number) => {
        const img = getImg();
        if (!img) return;
        setBrightness(val);
        applyAdjustments(img, val, contrast, saturation);
    };

    const handleContrast = (val: number) => {
        const img = getImg();
        if (!img) return;
        setContrast(val);
        applyAdjustments(img, brightness, val, saturation);
    };

    const handleSaturation = (val: number) => {
        const img = getImg();
        if (!img) return;
        setSaturation(val);
        applyAdjustments(img, brightness, contrast, val);
    };

    const applyAdjustments = (img: fabric.Image, b: number, c: number, s: number) => {
        if (!canvas) return;

        (fabric as any).filterBackend = new fabric.Canvas2dFilterBackend();
        (fabric as any).textureSize = 8192;
        img.objectCaching = false;

        const savedProps = {
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            originX: img.originX,
            originY: img.originY,
        };

        if (!img.filters) img.filters = [];
        img.filters = [];

        if (b !== 0) img.filters.push(new fabric.Image.filters.Brightness({ brightness: b / 100 }));
        if (c !== 0) img.filters.push(new fabric.Image.filters.Contrast({ contrast: c / 100 }));
        if (s !== 0) img.filters.push(new fabric.Image.filters.Saturation({ saturation: s / 100 }));

        img.applyFilters();
        img.set(savedProps);
        img.setCoords();

        canvas.requestRenderAll();
    };

    return (
        <div className="flex items-center gap-4 px-4 h-full w-full">
            {/* Replace */}
            <div className="flex items-center">
                <StitchButton size="sm" variant="ghost" onClick={handleReplace} title="Replace Image">
                    <ImageIcon size={14} className="mr-2" /> Replace
                </StitchButton>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Flip & Rotate */}
            <div className="flex items-center gap-1">
                <StitchButton size="sm" variant="ghost" onClick={handleFlipHorizontal} title="Flip Horizontal">
                    <MoveHorizontal size={14} />
                </StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={handleFlipVertical} title="Flip Vertical">
                    <MoveVertical size={14} />
                </StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={handleRotate90CCW} title="Rotate 90° CCW">
                    <RotateCcw size={14} />
                </StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={handleRotate90CW} title="Rotate 90° CW">
                    <RotateCw size={14} />
                </StitchButton>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Opacity */}
            <div className="w-32 flex items-center gap-2">
                <span className="text-[10px] text-[var(--stitch-text-tertiary)] uppercase font-semibold">Opacity</span>
                <StitchSlider
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={handleOpacity}
                />
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Filters Dropdown */}
            <div className="relative">
                <StitchButton
                    size="sm"
                    variant={showFilters ? 'primary' : 'ghost'}
                    onClick={() => { setShowFilters(!showFilters); setShowAdjust(false); }}
                >
                    <Filter size={14} className="mr-2" /> Filters
                </StitchButton>
                {showFilters && (
                    <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-[var(--stitch-surface-elevated)] border border-[var(--stitch-border)] rounded-md shadow-xl z-50 py-1">
                        <button className="w-full text-left px-4 py-2 hover:bg-[var(--stitch-surface-hover)] text-sm text-[var(--stitch-text-primary)]" onClick={() => applyFilter('none')}>None</button>
                        <button className="w-full text-left px-4 py-2 hover:bg-[var(--stitch-surface-hover)] text-sm text-[var(--stitch-text-primary)]" onClick={() => applyFilter('grayscale')}>Grayscale</button>
                        <button className="w-full text-left px-4 py-2 hover:bg-[var(--stitch-surface-hover)] text-sm text-[var(--stitch-text-primary)]" onClick={() => applyFilter('sepia')}>Sepia</button>
                        <button className="w-full text-left px-4 py-2 hover:bg-[var(--stitch-surface-hover)] text-sm text-[var(--stitch-text-primary)]" onClick={() => applyFilter('invert')}>Invert</button>
                        <button className="w-full text-left px-4 py-2 hover:bg-[var(--stitch-surface-hover)] text-sm text-[var(--stitch-text-primary)]" onClick={() => applyFilter('blur')}>Blur</button>
                        <button className="w-full text-left px-4 py-2 hover:bg-[var(--stitch-surface-hover)] text-sm text-[var(--stitch-text-primary)]" onClick={() => applyFilter('vintage')}>Vintage</button>
                    </div>
                )}
            </div>

            {/* Adjust Dropdown */}
            <div className="relative">
                <StitchButton
                    size="sm"
                    variant={showAdjust ? 'primary' : 'ghost'}
                    onClick={() => { setShowAdjust(!showAdjust); setShowFilters(false); }}
                >
                    <Sliders size={14} className="mr-2" /> Adjust
                </StitchButton>
                {showAdjust && (
                    <div className="absolute top-full left-0 mt-2 w-[280px] bg-[var(--stitch-surface-elevated)] border border-[var(--stitch-border)] rounded-md shadow-xl z-50 p-4 space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-[var(--stitch-text-secondary)]">
                                <span className="flex items-center gap-1"><Sun size={10} /> Brightness</span>
                                <span>{brightness}</span>
                            </div>
                            <StitchSlider min={-100} max={100} value={brightness} onChange={handleBrightness} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-[var(--stitch-text-secondary)]">
                                <span className="flex items-center gap-1"><Moon size={10} /> Contrast</span>
                                <span>{contrast}</span>
                            </div>
                            <StitchSlider min={-100} max={100} value={contrast} onChange={handleContrast} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-[var(--stitch-text-secondary)]">
                                <span className="flex items-center gap-1"><Droplet size={10} /> Saturation</span>
                                <span>{saturation}</span>
                            </div>
                            <StitchSlider min={-100} max={100} value={saturation} onChange={handleSaturation} />
                        </div>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Actions */}
            <div className="flex items-center gap-1">
                <StitchButton size="sm" variant="ghost" onClick={handleReset} title="Reset All">
                    <RefreshCw size={14} />
                </StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={handleDuplicate} title="Duplicate">
                    <Copy size={14} />
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={isLocked ? 'secondary' : 'ghost'}
                    onClick={handleLock}
                    title={isLocked ? "Unlock" : "Lock"}
                    className={isLocked ? '!text-red-400 !bg-red-900/10' : ''}
                >
                    {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                </StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={handleDelete} title="Delete" className="hover:text-red-400 hover:bg-red-900/10">
                    <Trash2 size={14} />
                </StitchButton>
            </div>
        </div>
    );
};
