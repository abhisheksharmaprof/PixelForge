import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDataStore } from '../../store/dataStore';
import { ElementFactory } from '../../utils/elementFactory';
import { ColorPicker } from '../Shared/ColorPicker';
import { Input } from '../Shared/Input';
import { Slider } from '../Shared/Slider';
import { Dropdown } from '../Shared/Dropdown';
import { Accordion } from '../Shared/Accordion';
import { Button } from '../Shared/Button';
import './ImageProperties.css';

export const ImageProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { excelData } = useDataStore();

    if (selectedObjects.length === 0 || selectedObjects[0].type !== 'image') {
        return <div className="image-properties">Select an image</div>;
    }

    const imgObj = selectedObjects[0] as fabric.Image;

    // State to force re-render when object on canvas changes
    const [_, setTick] = useState(0);

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
            case 'shaepen': // Typo in original but keeping for consistency if needed, fixed here
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
        { name: 'None', value: 'none' },
        { name: 'Vintage', value: 'vintage' },
        { name: 'B&W', value: 'blackwhite' },
        { name: 'Cold', value: 'cold' },
        { name: 'Warm', value: 'warm' },
        { name: 'Dramatic', value: 'dramatic' },
        { name: 'Soft', value: 'soft' },
        { name: 'Sharpen', value: 'sharpen' }, // Fixed value
        { name: 'Invert', value: 'invert' },
    ];

    return (
        <div className="image-properties properties-panel-content">

            {/* Header */}
            <div className="property-header">
                <h3>Image Properties</h3>
                <div className="image-dimensions">
                    {Math.round(imgObj.width || 0)} × {Math.round(imgObj.height || 0)} px
                </div>
            </div>

            {/* 1. Transform */}
            <Accordion title="Transform" defaultOpen>
                <div className="property-group">
                    <label>Position</label>
                    <div className="two-column-input">
                        <Input type="number" label="X" value={Math.round(imgObj.left || 0)} onChange={(v) => updateProperty('left', Number(v))} />
                        <Input type="number" label="Y" value={Math.round(imgObj.top || 0)} onChange={(v) => updateProperty('top', Number(v))} />
                    </div>
                </div>
                <div className="property-group">
                    <label>Size</label>
                    <div className="two-column-input">
                        <Input
                            type="number" label="W"
                            value={Math.round((imgObj.width || 0) * (imgObj.scaleX || 1))}
                            onChange={(v) => {
                                const scale = Number(v) / (imgObj.width || 1);
                                updateProperty('scaleX', scale);
                                if ((imgObj as any).lockAspectRatio) updateProperty('scaleY', scale);
                            }}
                        />
                        <Input
                            type="number" label="H"
                            value={Math.round((imgObj.height || 0) * (imgObj.scaleY || 1))}
                            onChange={(v) => {
                                const scale = Number(v) / (imgObj.height || 1);
                                updateProperty('scaleY', scale);
                                if ((imgObj as any).lockAspectRatio) updateProperty('scaleX', scale);
                            }}
                        />
                    </div>
                </div>
                <div className="property-group">
                    <label>Rotation</label>
                    <div className="input-with-slider">
                        <Slider min={-180} max={180} value={imgObj.angle || 0} onChange={(v) => updateProperty('angle', v)} />
                        <Input type="number" value={Math.round(imgObj.angle || 0)} onChange={(v) => updateProperty('angle', Number(v))} min={-180} max={180} suffix="°" />
                    </div>
                </div>
                <div className="property-group">
                    <label>Flip</label>
                    <div className="button-group">
                        <Button variant={imgObj.flipX ? 'primary' : 'outline'} onClick={() => updateProperty('flipX', !imgObj.flipX)} fullWidth>Horizontal</Button>
                        <Button variant={imgObj.flipY ? 'primary' : 'outline'} onClick={() => updateProperty('flipY', !imgObj.flipY)} fullWidth>Vertical</Button>
                    </div>
                </div>
            </Accordion>

            {/* 2. Appearance */}
            <Accordion title="Appearance">
                <div className="property-group">
                    <label>Opacity</label>
                    <div className="input-with-slider">
                        <Slider min={0} max={100} value={Math.round((imgObj.opacity || 1) * 100)} onChange={(v) => updateProperty('opacity', v / 100)} />
                        <Input type="number" value={Math.round((imgObj.opacity || 1) * 100)} onChange={(v) => updateProperty('opacity', Number(v) / 100)} min={0} max={100} suffix="%" />
                    </div>
                </div>
                <div className="property-group">
                    <label>Blend Mode</label>
                    <Dropdown
                        value={(imgObj.globalCompositeOperation as string) || 'source-over'}
                        onChange={(val) => updateProperty('globalCompositeOperation', val)}
                        options={[
                            { label: 'Normal', value: 'source-over' },
                            { label: 'Multiply', value: 'multiply' },
                            { label: 'Screen', value: 'screen' },
                            { label: 'Overlay', value: 'overlay' },
                            { label: 'Darken', value: 'darken' },
                            { label: 'Lighten', value: 'lighten' },
                            { label: 'Color Dodge', value: 'color-dodge' },
                            { label: 'Color Burn', value: 'color-burn' },
                        ]}
                    />
                </div>
                <div className="property-group">
                    <label>Border</label>
                    <div className="two-column-input">
                        <ColorPicker color={imgObj.stroke as string || '#000000'} onChange={(c) => updateProperty('stroke', c)} label="Color" />
                        <Input type="number" label="Width" value={imgObj.strokeWidth || 0} onChange={(v) => updateProperty('strokeWidth', Number(v))} min={0} />
                    </div>
                </div>
                <div className="property-group">
                    <label>Corner Radius</label>
                    <div className="input-with-slider">
                        <Slider min={0} max={100} value={(imgObj.clipPath as any)?.rx || 0} onChange={(v) => {
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
                        }} />
                        <Input type="number" value={(imgObj.clipPath as any)?.rx || 0} onChange={() => { }} />
                    </div>
                </div>
                <div className="property-group">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={!!imgObj.shadow} onChange={(e) => {
                            updateProperty('shadow', e.target.checked ? new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 5, offsetY: 5 }) : null);
                        }} />
                        Enable Shadow
                    </label>
                </div>
                {imgObj.shadow && (
                    <div className="property-group">
                        <label>Shadow Blur</label>
                        <Slider min={0} max={50} value={(imgObj.shadow as fabric.Shadow).blur || 0} onChange={(v) => {
                            (imgObj.shadow as fabric.Shadow).blur = v;
                            updateProperty('shadow', imgObj.shadow);
                        }} />
                    </div>
                )}
            </Accordion>

            {/* 3. Effects */}
            <Accordion title="Effects">
                <div className="property-section-label">Adjustments</div>
                {['Brightness', 'Contrast', 'Saturation', 'HueRotation', 'Blur'].map((effect) => (
                    <div className="property-group" key={effect}>
                        <label>{effect === 'HueRotation' ? 'Hue' : effect}</label>
                        <div className="input-with-slider">
                            <Slider
                                min={effect === 'Blur' ? 0 : (effect === 'HueRotation' ? 0 : -100)}
                                max={effect === 'Blur' ? 100 : (effect === 'HueRotation' ? 360 : 100)}
                                value={getFilterValue(effect)}
                                onChange={(v) => updateFilter(effect, v)}
                            />
                        </div>
                    </div>
                ))}

                <div className="property-separator" style={{ margin: '16px 0', borderTop: '1px solid var(--border-color)' }} />

                <div className="property-section-label">Filters</div>
                <div className="filter-presets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {filterPresets.map((preset) => {
                        let filterStyle = {};
                        switch (preset.value) {
                            case 'vintage': filterStyle = { filter: 'sepia(1) contrast(0.9) brightness(1.1)', background: '#d4c4a8' }; break;
                            case 'blackwhite': filterStyle = { filter: 'grayscale(1) contrast(1.2)', background: '#888' }; break;
                            case 'cold': filterStyle = { filter: 'hue-rotate(180deg) saturate(0.2)', background: '#a8c4d4' }; break;
                            case 'warm': filterStyle = { filter: 'sepia(0.3) saturate(1.3)', background: '#d4a8a8' }; break;
                            case 'dramatic': filterStyle = { filter: 'contrast(1.5) saturate(1.2)', background: '#444' }; break;
                            case 'soft': filterStyle = { filter: 'brightness(1.1) blur(0.5px)', background: '#f0f0f0' }; break;
                            case 'sharpen': filterStyle = { background: '#ccc' }; break;
                            case 'invert': filterStyle = { filter: 'invert(1)', background: '#000' }; break;
                            default: filterStyle = { background: '#fff' }; break;
                        }

                        return (
                            <button
                                key={preset.value}
                                className={`filter-preset-button ${(imgObj as any).filterPreset === preset.value ? 'active' : ''}`}
                                onClick={() => applyFilterPreset(preset.value)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: '1px solid transparent', cursor: 'pointer', padding: '4px' }}
                            >
                                <div className="preset-preview" style={{ width: '100%', aspectRatio: '1', borderRadius: '4px', marginBottom: '4px', border: '1px solid #ddd', ...filterStyle }}></div>
                                <span style={{ fontSize: '10px' }}>{preset.name}</span>
                            </button>
                        )
                    })}
                </div>
            </Accordion>

            {/* 4. Replace & Source */}
            <Accordion title="Source & Replace">
                <div className="property-group">
                    <Button variant="outline" fullWidth onClick={() => {
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
                    }}>
                        Replace Image
                    </Button>
                </div>
                {/* Dynamic Data Mapping */}
                <div className="property-group">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={(imgObj as any).isDynamic || false} onChange={(e) => {
                            (imgObj as any).isDynamic = e.target.checked;
                            setTick(t => t + 1);
                        }} />
                        Dynamic (Data Source)
                    </label>
                </div>
                {(imgObj as any).isDynamic && excelData && (
                    <div className="property-group">
                        <Dropdown
                            value={(imgObj as any).dynamicColumnMapping || ''}
                            onChange={(v) => { (imgObj as any).dynamicColumnMapping = v; }}
                            options={excelData.columns.map(c => ({ label: c.name, value: c.name }))}
                        />
                    </div>
                )}
            </Accordion>

            {/* 5. Export */}
            <Accordion title="Export">
                <div className="property-group">
                    <label>Format</label>
                    <Dropdown
                        value="png"
                        onChange={() => { }}
                        options={[{ label: 'PNG', value: 'png' }, { label: 'JPG', value: 'jpg' }, { label: 'SVG', value: 'svg' }]}
                    />
                </div>
                <div className="property-group">
                    <Button variant="primary" fullWidth onClick={() => {
                        const dataURL = imgObj.toDataURL({ format: 'png', multiplier: 2 });
                        const link = document.createElement('a');
                        link.download = 'image.png';
                        link.href = dataURL;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}>
                        Download Image
                    </Button>
                </div>
            </Accordion>

        </div>
    );
};
