import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDataStore } from '../../store/dataStore';
import { ElementFactory } from '../../utils/elementFactory';
import { StitchAccordion } from '../common/StitchAccordion';
import { StitchSlider } from '../common/StitchSlider';
import { StitchColorPicker } from '../common/StitchColorPicker';
import {
    Move, Maximize, RotateCw, FlipHorizontal, FlipVertical,
    Layers, Sun, Image as ImageIcon, Download, Upload,
    Wand2, Trash2
} from 'lucide-react';
import clsx from 'clsx';
// CSS removed

export const ImageProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { excelData } = useDataStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State to force re-render when object on canvas changes
    const [_, setTick] = useState(0);

    if (selectedObjects.length === 0 || (selectedObjects[0].type !== 'image' && (selectedObjects[0] as any).elementType !== 'mailmerge-image-placeholder')) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-[var(--stitch-text-tertiary)] gap-2">
                <ImageIcon size={32} strokeWidth={1.5} />
                <p className="text-sm">Select an image to edit</p>
            </div>
        );
    }

    const imgObj = selectedObjects[0] as fabric.Image;

    // Update property
    const updateProperty = (property: string, value: any) => {
        if (!canvas) return;
        imgObj.set({ [property]: value });
        imgObj.setCoords();
        canvas.renderAll();
        setTick(t => t + 1);
    };

    // Update filter
    const updateFilter = (filterType: string, value: any) => {
        if (!canvas) return;

        let filters = imgObj.filters || [];
        filters = filters.filter((f: any) => f.type !== filterType);

        let newFilter: fabric.IBaseFilter | null = null;

        switch (filterType) {
            case 'Brightness':
                if (value !== 0) newFilter = new fabric.Image.filters.Brightness({ brightness: value / 100 });
                break;
            case 'Contrast':
                if (value !== 0) newFilter = new fabric.Image.filters.Contrast({ contrast: value / 100 });
                break;
            case 'Saturation':
                if (value !== 0) newFilter = new fabric.Image.filters.Saturation({ saturation: value / 100 });
                break;
            case 'HueRotation':
                if (value !== 0) newFilter = new fabric.Image.filters.HueRotation({ rotation: value / 360 });
                break;
            case 'Blur':
                if (value > 0) newFilter = new fabric.Image.filters.Blur({ blur: value / 100 });
                break;
            case 'Noise':
                if (value > 0 && (fabric.Image.filters as any).Noise) {
                    newFilter = new (fabric.Image.filters as any).Noise({ noise: value });
                }
                break;
        }

        if (newFilter) {
            filters.push(newFilter);
        }

        imgObj.filters = filters;
        imgObj.applyFilters();
        canvas.renderAll();
        setTick(t => t + 1);
    };

    // Get current filter value
    const getFilterValue = (filterType: string): number => {
        const filters = imgObj.filters || [];
        const filter = filters.find((f: any) => f.type === filterType);
        if (!filter) return 0;

        switch (filterType) {
            case 'Brightness': return ((filter as any).brightness || 0) * 100;
            case 'Contrast': return ((filter as any).contrast || 0) * 100;
            case 'Saturation': return ((filter as any).saturation || 0) * 100;
            case 'HueRotation': return ((filter as any).rotation || 0) * 360;
            case 'Blur': return ((filter as any).blur || 0) * 100;
            case 'Noise': return ((filter as any).noise || 0);
            default: return 0;
        }
    };

    // Update properties when selection changes OR object is modified
    useEffect(() => {
        if (selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
            const handleModification = () => setTick(t => t + 1);
            const object = selectedObjects[0];
            object.on('moving', handleModification);
            object.on('scaling', handleModification);
            object.on('rotating', handleModification);
            object.on('modified', handleModification);

            return () => {
                object.off('moving', handleModification);
                object.off('scaling', handleModification);
                object.off('rotating', handleModification);
                object.off('modified', handleModification);
            };
        }
    }, [selectedObjects]);

    // Apply filter preset
    const applyFilterPreset = (preset: string) => {
        if (!canvas) return;

        let filters: fabric.IBaseFilter[] = [];
        switch (preset) {
            case 'vintage':
                filters = [
                    new fabric.Image.filters.Sepia(),
                    new fabric.Image.filters.Brightness({ brightness: 0.1 }),
                    new fabric.Image.filters.Contrast({ contrast: -0.1 }),
                ];
                break;
            case 'blackwhite':
                filters = [
                    new fabric.Image.filters.Grayscale(),
                    new fabric.Image.filters.Contrast({ contrast: 0.2 }),
                ];
                break;
            case 'cold':
                filters = [
                    new fabric.Image.filters.HueRotation({ rotation: 0.6 }),
                    new fabric.Image.filters.Saturation({ saturation: 0.2 }),
                ];
                break;
            case 'warm':
                filters = [
                    new fabric.Image.filters.HueRotation({ rotation: -0.1 }),
                    new fabric.Image.filters.Saturation({ saturation: 0.3 }),
                ];
                break;
            case 'dramatic':
                filters = [
                    new fabric.Image.filters.Contrast({ contrast: 0.5 }),
                    new fabric.Image.filters.Brightness({ brightness: -0.1 }),
                    new fabric.Image.filters.Saturation({ saturation: 0.2 }),
                ];
                break;
            case 'soft':
                filters = [
                    new fabric.Image.filters.Blur({ blur: 0.2 }),
                    new fabric.Image.filters.Brightness({ brightness: 0.1 }),
                ];
                break;
            case 'invert':
                filters = [new fabric.Image.filters.Invert()];
                break;
            case 'sharpen':
                filters = [
                    new fabric.Image.filters.Convolute({
                        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
                    }),
                ];
                break;
            case 'none':
            default:
                filters = [];
                break;
        }

        imgObj.filters = filters;
        (imgObj as any).filterPreset = preset;
        imgObj.applyFilters();
        (imgObj as any).dirty = true;
        canvas.requestRenderAll();
        setTick(t => t + 1);
    };

    const filterPresets = [
        { name: 'None', value: 'none', bg: '#ffffff' },
        { name: 'Vintage', value: 'vintage', bg: '#d4c4a8' }, // Sepia-ish
        { name: 'B&W', value: 'blackwhite', bg: '#888888' },
        { name: 'Cold', value: 'cold', bg: '#a8c4d4' },
        { name: 'Warm', value: 'warm', bg: '#d4a8a8' },
        { name: 'Dramatic', value: 'dramatic', bg: '#444444' },
        { name: 'Soft', value: 'soft', bg: '#f0f0f0' },
        { name: 'Sharpen', value: 'sharpen', bg: '#cccccc' },
        { name: 'Invert', value: 'invert', bg: '#000000' },
    ];

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--stitch-border)]">
                <h3 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Image</h3>
                <div className="text-xs text-[var(--stitch-text-tertiary)]">
                    {Math.round(imgObj.width || 0)} × {Math.round(imgObj.height || 0)} px
                </div>
            </div>

            {/* 1. Transform */}
            <StitchAccordion title="Transform" icon={<Move size={16} />} defaultOpen>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Position</label>
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center bg-white border border-[var(--stitch-border)] rounded-md px-2 shadow-sm">
                                <span className="text-xs text-[var(--stitch-text-muted)] mr-2 font-medium">X</span>
                                <input
                                    type="number"
                                    className="w-full py-1.5 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none"
                                    value={Math.round(imgObj.left || 0)}
                                    onChange={(e) => updateProperty('left', Number(e.target.value))}
                                />
                            </div>
                            <div className="flex-1 flex items-center bg-white border border-[var(--stitch-border)] rounded-md px-2 shadow-sm">
                                <span className="text-xs text-[var(--stitch-text-muted)] mr-2 font-medium">Y</span>
                                <input
                                    type="number"
                                    className="w-full py-1.5 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none"
                                    value={Math.round(imgObj.top || 0)}
                                    onChange={(e) => updateProperty('top', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Size</label>
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center bg-white border border-[var(--stitch-border)] rounded-md px-2 shadow-sm">
                                <span className="text-xs text-[var(--stitch-text-muted)] mr-2 font-medium">W</span>
                                <input
                                    type="number"
                                    className="w-full py-1.5 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none"
                                    value={Math.round((imgObj.width || 0) * (imgObj.scaleX || 1))}
                                    onChange={(e) => {
                                        const scale = Number(e.target.value) / (imgObj.width || 1);
                                        updateProperty('scaleX', scale);
                                        if ((imgObj as any).lockAspectRatio) updateProperty('scaleY', scale);
                                    }}
                                />
                            </div>
                            <div className="flex-1 flex items-center bg-white border border-[var(--stitch-border)] rounded-md px-2 shadow-sm">
                                <span className="text-xs text-[var(--stitch-text-muted)] mr-2 font-medium">H</span>
                                <input
                                    type="number"
                                    className="w-full py-1.5 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none"
                                    value={Math.round((imgObj.height || 0) * (imgObj.scaleY || 1))}
                                    onChange={(e) => {
                                        const scale = Number(e.target.value) / (imgObj.height || 1);
                                        updateProperty('scaleY', scale);
                                        if ((imgObj as any).lockAspectRatio) updateProperty('scaleX', scale);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <StitchSlider
                        label={`Rotation: ${Math.round(imgObj.angle || 0)}°`}
                        min={-180}
                        max={180}
                        value={imgObj.angle || 0}
                        onChange={(v) => updateProperty('angle', v)}
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Flip</label>
                        <div className="flex gap-2">
                            <button
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-sm font-medium",
                                    imgObj.flipX
                                        ? "bg-[var(--stitch-primary-light)] text-[var(--stitch-primary)] border border-[var(--stitch-primary)]"
                                        : "bg-[var(--stitch-background)] text-[var(--stitch-text-primary)] border border-[var(--stitch-border)] hover:bg-[var(--stitch-surface-hover)]"
                                )}
                                onClick={() => updateProperty('flipX', !imgObj.flipX)}
                            >
                                <FlipHorizontal size={16} /> Horizontal
                            </button>
                            <button
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-sm font-medium",
                                    imgObj.flipY
                                        ? "bg-[var(--stitch-primary-light)] text-[var(--stitch-primary)] border border-[var(--stitch-primary)]"
                                        : "bg-[var(--stitch-background)] text-[var(--stitch-text-primary)] border border-[var(--stitch-border)] hover:bg-[var(--stitch-surface-hover)]"
                                )}
                                onClick={() => updateProperty('flipY', !imgObj.flipY)}
                            >
                                <FlipVertical size={16} /> Vertical
                            </button>
                        </div>
                    </div>
                </div>
            </StitchAccordion>

            {/* 2. Appearance */}
            <StitchAccordion title="Appearance" icon={<Layers size={16} />}>
                <div className="space-y-4">
                    <StitchSlider
                        label={`Opacity: ${Math.round((imgObj.opacity || 1) * 100)}%`}
                        min={0}
                        max={100}
                        value={(imgObj.opacity || 1) * 100}
                        onChange={(v) => updateProperty('opacity', v / 100)}
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Blend Mode</label>
                        <select
                            className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:border-[var(--stitch-primary)] focus:outline-none"
                            value={(imgObj.globalCompositeOperation as string) || 'source-over'}
                            onChange={(e) => updateProperty('globalCompositeOperation', e.target.value)}
                        >
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                            <option value="overlay">Overlay</option>
                            <option value="darken">Darken</option>
                            <option value="lighten">Lighten</option>
                            <option value="color-dodge">Color Dodge</option>
                            <option value="color-burn">Color Burn</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Border</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <StitchColorPicker
                                    color={imgObj.stroke as string || '#000000'}
                                    onChange={(c) => updateProperty('stroke', c)}
                                />
                            </div>
                            <div className="w-24">
                                <StitchSlider
                                    label="Width"
                                    min={0}
                                    max={20}
                                    value={imgObj.strokeWidth || 0}
                                    onChange={(v) => updateProperty('strokeWidth', v)}
                                />
                            </div>
                        </div>
                    </div>

                    <StitchSlider
                        label="Corner Radius"
                        min={0}
                        max={100}
                        value={(imgObj.clipPath as any)?.rx || 0}
                        onChange={(v) => {
                            if (v === 0) { imgObj.clipPath = undefined; }
                            else {
                                const clipPath = new fabric.Rect({
                                    width: imgObj.width, height: imgObj.height,
                                    rx: v, ry: v,
                                    left: -(imgObj.width!) / 2, top: -(imgObj.height!) / 2,
                                    originX: 'center', originY: 'center'
                                });
                                imgObj.clipPath = clipPath;
                            }
                            canvas?.renderAll();
                            setTick(t => t + 1);
                        }}
                    />

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-[var(--stitch-text-primary)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!imgObj.shadow}
                                onChange={(e) => {
                                    updateProperty('shadow', e.target.checked ? new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 5, offsetY: 5 }) : null);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-[var(--stitch-primary)]"
                            />
                            Enable Shadow
                        </label>
                    </div>

                    {imgObj.shadow && (
                        <StitchSlider
                            label="Shadow Blur"
                            min={0}
                            max={50}
                            value={(imgObj.shadow as fabric.Shadow).blur || 0}
                            onChange={(v) => {
                                (imgObj.shadow as fabric.Shadow).blur = v;
                                updateProperty('shadow', imgObj.shadow);
                            }}
                        />
                    )}
                </div>
            </StitchAccordion>

            {/* 3. Effects */}
            <StitchAccordion title="Effects" icon={<Wand2 size={16} />}>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-[var(--stitch-text-primary)] uppercase tracking-wider">Adjustments</label>
                        {['Brightness', 'Contrast', 'Saturation', 'HueRotation', 'Blur'].map((effect) => (
                            <StitchSlider
                                key={effect}
                                label={effect === 'HueRotation' ? 'Hue' : effect}
                                min={effect === 'Blur' ? 0 : (effect === 'HueRotation' ? 0 : -100)}
                                max={effect === 'Blur' ? 100 : (effect === 'HueRotation' ? 360 : 100)}
                                value={getFilterValue(effect)}
                                onChange={(v) => updateFilter(effect, v)}
                            />
                        ))}
                    </div>

                    <div className="border-t border-[var(--stitch-border)] pt-4 space-y-3">
                        <label className="text-xs font-semibold text-[var(--stitch-text-primary)] uppercase tracking-wider">Presets</label>
                        <div className="grid grid-cols-4 gap-2">
                            {filterPresets.map((preset) => (
                                <button
                                    key={preset.value}
                                    className={clsx(
                                        "flex flex-col items-center gap-1 p-1 rounded-md transition-colors",
                                        (imgObj as any).filterPreset === preset.value
                                            ? "bg-[var(--stitch-primary-light)] ring-1 ring-[var(--stitch-primary)]"
                                            : "hover:bg-[var(--stitch-surface-hover)]"
                                    )}
                                    onClick={() => applyFilterPreset(preset.value)}
                                >
                                    <div
                                        className="w-full aspect-square rounded border border-[var(--stitch-border)]"
                                        style={{ backgroundColor: preset.bg }}
                                    />
                                    <span className="text-[10px] text-[var(--stitch-text-secondary)]">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </StitchAccordion>

            {/* 4. Replace & Source */}
            <StitchAccordion title="Source & Replace" icon={<ImageIcon size={16} />}>
                <div className="space-y-4">
                    <button
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-lg text-sm font-medium text-[var(--stitch-text-primary)] hover:border-[var(--stitch-primary)] hover:text-[var(--stitch-primary)] transition-colors"
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    fabric.Image.fromURL(ev.target?.result as string, (newImg) => {
                                        imgObj.setElement(newImg.getElement());
                                        imgObj.set({ width: newImg.width, height: newImg.height });
                                        if (canvas) ElementFactory.scaleImageToFit(imgObj, canvas.getWidth(), canvas.getHeight());
                                        canvas?.renderAll();
                                        setTick(t => t + 1);
                                    });
                                };
                                reader.readAsDataURL(file);
                            };
                            input.click();
                        }}
                    >
                        <Upload size={14} /> Replace Image
                    </button>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-[var(--stitch-text-primary)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(imgObj as any).isDynamic || false}
                                onChange={(e) => {
                                    (imgObj as any).isDynamic = e.target.checked;
                                    setTick(t => t + 1);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-[var(--stitch-primary)]"
                            />
                            Dynamic (Data Source)
                        </label>
                    </div>

                    {(imgObj as any).isDynamic && excelData && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Data Column</label>
                            <select
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:border-[var(--stitch-primary)] focus:outline-none"
                                value={(imgObj as any).dynamicColumnMapping || ''}
                                onChange={(e) => { (imgObj as any).dynamicColumnMapping = e.target.value; }}
                            >
                                <option value="">Select Column...</option>
                                {excelData.columns.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </StitchAccordion>

            {/* 5. Export */}
            <StitchAccordion title="Export" icon={<Download size={16} />}>
                <div className="space-y-4">
                    <button
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[var(--stitch-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--stitch-primary-hover)] transition-colors shadow-sm"
                        onClick={() => {
                            const dataURL = imgObj.toDataURL({ format: 'png', multiplier: 2 });
                            const link = document.createElement('a');
                            link.download = `image-${Date.now()}.png`;
                            link.href = dataURL;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <Download size={14} /> Download Image
                    </button>
                </div>
            </StitchAccordion>
        </div>
    );
};
