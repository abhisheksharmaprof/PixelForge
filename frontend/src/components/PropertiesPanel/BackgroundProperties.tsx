import React, { useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { Lock, Unlock, Upload, Trash2, X, Stamp } from 'lucide-react';
import { StitchAccordion } from '../common/StitchAccordion';
import { StitchSlider } from '../common/StitchSlider';
import { StitchColorPicker } from '../common/StitchColorPicker';
import clsx from 'clsx';
// CSS removed

export const BackgroundProperties: React.FC = () => {
    const {
        canvas,
        canvasSize,
        backgroundType,
        setBackgroundType,
        backgroundColor,
        setBackgroundColor,
        backgroundGradient,
        setBackgroundGradient,
        backgroundImage,
        setBackgroundImage,
        backgroundImageFit,
        setBackgroundImageFit,
        backgroundImageOpacity,
        setBackgroundImageOpacity,
        backgroundImageRotation,
        setBackgroundImageRotation,
        backgroundEffects,
        setBackgroundEffects,
        backgroundLocked,
        setBackgroundLocked,
        watermark,
        setWatermark,
    } = useCanvasStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const watermarkImageRef = useRef<HTMLInputElement>(null);

    // Apply background image with current settings
    const applyBackgroundImage = (
        imageUrl: string,
        fit: string = backgroundImageFit,
        opacity: number = backgroundImageOpacity,
        rotation: number = backgroundImageRotation,
        effects: typeof backgroundEffects = backgroundEffects
    ) => {
        if (!canvas || !imageUrl) return;

        (window as any).fabric.Image.fromURL(imageUrl, (img: any) => {
            const cw = canvasSize.width;
            const ch = canvasSize.height;

            // Apply rotation
            img.set({ angle: rotation });

            // Apply fit mode
            switch (fit) {
                case 'fill':
                    img.scaleToWidth(cw);
                    if (img.getScaledHeight() < ch) img.scaleToHeight(ch);
                    break;
                case 'fit':
                    const scaleW = cw / (img.width || 1);
                    const scaleH = ch / (img.height || 1);
                    const scale = Math.min(scaleW, scaleH);
                    img.scale(scale);
                    break;
                case 'stretch':
                    img.set({
                        scaleX: cw / (img.width || 1),
                        scaleY: ch / (img.height || 1)
                    });
                    break;
                case 'center':
                    // Keep original size, centered
                    break;
                case 'tile':
                    // For tiling, we'd need a pattern - simplified for now
                    img.scaleToWidth(cw / 3);
                    break;
            }

            // Apply opacity
            img.set({ opacity: opacity });

            // Apply effects using filters
            img.filters = [];

            if (effects.blur > 0) {
                img.filters.push(new (window as any).fabric.Image.filters.Blur({
                    blur: effects.blur / 100
                }));
            }
            if (effects.brightness !== 0) {
                img.filters.push(new (window as any).fabric.Image.filters.Brightness({
                    brightness: effects.brightness / 100
                }));
            }
            if (effects.contrast !== 0) {
                img.filters.push(new (window as any).fabric.Image.filters.Contrast({
                    contrast: effects.contrast / 100
                }));
            }
            if (effects.saturation !== 0) {
                img.filters.push(new (window as any).fabric.Image.filters.Saturation({
                    saturation: effects.saturation / 100
                }));
            }

            // Disable WebGL for filter application to prevent clipping
            (window as any).fabric.filterBackend = new (window as any).fabric.Canvas2dFilterBackend();
            img.applyFilters();

            canvas.setBackgroundImage(img, () => canvas.renderAll());
        });
    };

    const handleColorChange = (color: string) => {
        setBackgroundColor(color);
        if (canvas && backgroundType === 'solid') {
            canvas.setBackgroundColor(color, () => canvas.renderAll());
        }
    };

    const applyGradient = () => {
        if (!canvas) return;

        const { angle, stops } = backgroundGradient;
        const rad = (angle * Math.PI) / 180;
        const w = canvas.width || 800;
        const h = canvas.height || 600;

        const coords = backgroundGradient.type === 'linear'
            ? { x1: 0, y1: 0, x2: w * Math.cos(rad), y2: h * Math.sin(rad) }
            : { x1: w / 2, y1: h / 2, r1: 0, x2: w / 2, y2: h / 2, r2: Math.max(w, h) / 2 };

        const gradientObj = new (window as any).fabric.Gradient({
            type: backgroundGradient.type,
            coords,
            colorStops: stops.map(s => ({ offset: s.offset, color: s.color }))
        });

        canvas.setBackgroundColor(gradientObj, () => canvas.renderAll());
    };

    const handleGradientColorChange = (index: number, color: string) => {
        const newStops = [...backgroundGradient.stops];
        newStops[index] = { ...newStops[index], color };
        setBackgroundGradient({ stops: newStops });
        setTimeout(applyGradient, 0);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setBackgroundType('image');
            setBackgroundImage(dataUrl);
            applyBackgroundImage(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleFitChange = (fit: typeof backgroundImageFit) => {
        setBackgroundImageFit(fit);
        if (backgroundImage) {
            applyBackgroundImage(backgroundImage, fit);
        }
    };

    const handleOpacityChange = (opacity: number) => {
        setBackgroundImageOpacity(opacity);
        if (backgroundImage) {
            applyBackgroundImage(backgroundImage, backgroundImageFit, opacity);
        }
    };

    const handleRotationChange = (rotation: number) => {
        setBackgroundImageRotation(rotation);
        if (backgroundImage) {
            applyBackgroundImage(backgroundImage, backgroundImageFit, backgroundImageOpacity, rotation);
        }
    };

    const handleEffectChange = (effect: string, value: number) => {
        const newEffects = { ...backgroundEffects, [effect]: value };
        setBackgroundEffects(newEffects);
        if (backgroundImage && backgroundType === 'image') {
            applyBackgroundImage(backgroundImage, backgroundImageFit, backgroundImageOpacity, backgroundImageRotation, newEffects);
        }
    };

    const clearBackground = () => {
        setBackgroundType('transparent');
        setBackgroundImage(null);
        if (canvas) {
            canvas.setBackgroundColor('', () => {
                canvas.setBackgroundImage(null as any, () => canvas.renderAll());
            });
        }
    };

    // Watermark functions
    const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setWatermark({ type: 'image', image: event.target?.result as string });
        };
        reader.readAsDataURL(file);
    };

    const applyWatermark = () => {
        if (!canvas) return;

        // Remove existing watermarks
        const existingWatermarks = canvas.getObjects().filter((obj: any) => obj.isWatermark);
        existingWatermarks.forEach((obj: any) => canvas.remove(obj));

        if (!watermark.enabled) {
            canvas.renderAll();
            return;
        }

        const { position, opacity, rotation, scale, tiling, text, fontFamily, fontSize } = watermark;
        const cw = canvasSize.width;
        const ch = canvasSize.height;

        const posMap: Record<string, { x: number; y: number }> = {
            tl: { x: cw * 0.15, y: ch * 0.15 },
            tc: { x: cw * 0.5, y: ch * 0.15 },
            tr: { x: cw * 0.85, y: ch * 0.15 },
            ml: { x: cw * 0.15, y: ch * 0.5 },
            mc: { x: cw * 0.5, y: ch * 0.5 },
            mr: { x: cw * 0.85, y: ch * 0.5 },
            bl: { x: cw * 0.15, y: ch * 0.85 },
            bc: { x: cw * 0.5, y: ch * 0.85 },
            br: { x: cw * 0.85, y: ch * 0.85 },
        };

        const pos = posMap[position] || posMap.mc;

        const createWatermarkObject = (left: number, top: number, callback: (obj: any) => void) => {
            if (watermark.type === 'text') {
                const textObj = new (window as any).fabric.Text(text, {
                    left,
                    top,
                    originX: 'center',
                    originY: 'center',
                    fontFamily,
                    fontSize: fontSize * scale,
                    fill: `rgba(128, 128, 128, ${opacity})`,
                    angle: rotation,
                    selectable: false,
                    evented: false,
                });
                textObj.isWatermark = true;
                callback(textObj);
            } else if (watermark.type === 'image' && watermark.image) {
                (window as any).fabric.Image.fromURL(watermark.image, (img: any) => {
                    img.set({
                        left,
                        top,
                        originX: 'center',
                        originY: 'center',
                        scaleX: scale * 0.3,
                        scaleY: scale * 0.3,
                        opacity,
                        angle: rotation,
                        selectable: false,
                        evented: false,
                    });
                    img.isWatermark = true;
                    callback(img);
                });
            }
        };

        if (tiling) {
            const stepX = 250;
            const stepY = 200;
            for (let y = 50; y < ch; y += stepY) {
                for (let x = 50; x < cw; x += stepX) {
                    createWatermarkObject(x, y, (obj) => {
                        canvas.add(obj);
                    });
                }
            }
            canvas.renderAll();
        } else {
            createWatermarkObject(pos.x, pos.y, (obj) => {
                canvas.add(obj);
                canvas.renderAll();
            });
        }
    };

    const removeWatermark = () => {
        setWatermark({ enabled: false });
        if (canvas) {
            const existingWatermarks = canvas.getObjects().filter((obj: any) => obj.isWatermark);
            existingWatermarks.forEach((obj: any) => canvas.remove(obj));
            canvas.renderAll();
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--stitch-border)]">
                <h3 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Background</h3>
                <button
                    className={clsx(
                        "p-1.5 rounded transition-colors",
                        backgroundLocked ? "bg-[var(--stitch-primary-light)] text-[var(--stitch-primary)]" : "text-[var(--stitch-text-tertiary)] hover:bg-[var(--stitch-surface-hover)]"
                    )}
                    onClick={() => setBackgroundLocked(!backgroundLocked)}
                    title={backgroundLocked ? 'Unlock background' : 'Lock background'}
                >
                    {backgroundLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
            </div>

            {/* Background Type */}
            <div className="p-4 border-b border-[var(--stitch-border)] space-y-3">
                <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Type</label>
                <div className="flex bg-white rounded-lg p-1 border border-[var(--stitch-border)] shadow-sm">
                    {(['solid', 'gradient', 'image', 'transparent'] as const).map(type => (
                        <button
                            key={type}
                            className={clsx(
                                "flex-1 py-2 text-xs font-semibold rounded transition-all capitalize",
                                backgroundType === type
                                    ? "bg-[var(--stitch-primary)] text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                backgroundLocked && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => setBackgroundType(type)}
                            disabled={backgroundLocked}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Solid Color Options */}
            {backgroundType === 'solid' && (
                <StitchAccordion title="Solid Color" defaultOpen>
                    <StitchColorPicker
                        label="Background Color"
                        color={backgroundColor}
                        onChange={handleColorChange}
                    />
                </StitchAccordion>
            )}

            {/* Gradient Options */}
            {backgroundType === 'gradient' && (
                <StitchAccordion title="Gradient Settings" defaultOpen>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Gradient Type</label>
                            <select
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:border-[var(--stitch-primary)] focus:outline-none"
                                value={backgroundGradient.type}
                                onChange={(e) => {
                                    setBackgroundGradient({ type: e.target.value as 'linear' | 'radial' });
                                    setTimeout(applyGradient, 0);
                                }}
                                disabled={backgroundLocked}
                            >
                                <option value="linear">Linear</option>
                                <option value="radial">Radial</option>
                            </select>
                        </div>

                        <StitchSlider
                            label={`Angle: ${backgroundGradient.angle}°`}
                            min={0}
                            max={360}
                            value={backgroundGradient.angle}
                            onChange={(value) => {
                                setBackgroundGradient({ angle: value });
                                setTimeout(applyGradient, 0);
                            }}
                        />

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Gradient Colors</label>
                            <div className="flex gap-2">
                                {backgroundGradient.stops.map((stop, index) => (
                                    <div key={index} className="flex-1">
                                        <StitchColorPicker
                                            color={stop.color}
                                            onChange={(color) => handleGradientColorChange(index, color)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </StitchAccordion>
            )}

            {/* Image Options */}
            {backgroundType === 'image' && (
                <StitchAccordion title="Image Settings" defaultOpen>
                    <div className="space-y-4">
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-lg text-sm font-medium text-[var(--stitch-text-primary)] hover:border-[var(--stitch-primary)] hover:text-[var(--stitch-primary)] transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={backgroundLocked}
                            >
                                <Upload size={16} /> Upload Background Image
                            </button>
                        </div>

                        {backgroundImage && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Fit Mode</label>
                                    <select
                                        className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:border-[var(--stitch-primary)] focus:outline-none"
                                        value={backgroundImageFit}
                                        onChange={(e) => handleFitChange(e.target.value as any)}
                                        disabled={backgroundLocked}
                                    >
                                        <option value="fill">Fill (Cover)</option>
                                        <option value="fit">Fit (Contain)</option>
                                        <option value="stretch">Stretch</option>
                                        <option value="center">Center (Original)</option>
                                        <option value="tile">Tile</option>
                                    </select>
                                </div>

                                <StitchSlider
                                    label={`Opacity: ${Math.round(backgroundImageOpacity * 100)}%`}
                                    min={0}
                                    max={100}
                                    value={backgroundImageOpacity * 100}
                                    onChange={(value) => handleOpacityChange(value / 100)}
                                    showValue={false}
                                />

                                <StitchSlider
                                    label={`Rotation: ${backgroundImageRotation}°`}
                                    min={-180}
                                    max={180}
                                    value={backgroundImageRotation}
                                    onChange={(value) => handleRotationChange(value)}
                                    showValue={false}
                                />
                            </>
                        )}
                    </div>
                </StitchAccordion>
            )}

            {/* Background Effects (for image type) */}
            {backgroundType === 'image' && backgroundImage && (
                <StitchAccordion title="Effects">
                    <div className="space-y-4">
                        <StitchSlider
                            label="Blur"
                            min={0}
                            max={100}
                            value={backgroundEffects.blur}
                            onChange={(value) => handleEffectChange('blur', value)}
                        />
                        <StitchSlider
                            label="Brightness"
                            min={-100}
                            max={100}
                            value={backgroundEffects.brightness}
                            onChange={(value) => handleEffectChange('brightness', value)}
                        />
                        <StitchSlider
                            label="Contrast"
                            min={-100}
                            max={100}
                            value={backgroundEffects.contrast}
                            onChange={(value) => handleEffectChange('contrast', value)}
                        />
                        <StitchSlider
                            label="Saturation"
                            min={-100}
                            max={100}
                            value={backgroundEffects.saturation}
                            onChange={(value) => handleEffectChange('saturation', value)}
                        />
                    </div>
                </StitchAccordion>
            )}

            {/* Watermark Section */}
            <StitchAccordion title="Watermark" icon={<Stamp size={16} />}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-[var(--stitch-text-primary)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={watermark.enabled}
                                onChange={(e) => setWatermark({ enabled: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-[var(--stitch-primary)] focus:ring-[var(--stitch-primary)]"
                            />
                            Enable Watermark
                        </label>
                        {watermark.enabled && (
                            <button
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                onClick={removeWatermark}
                                title="Remove Watermark"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {watermark.enabled && (
                        <>
                            {/* Watermark Type */}
                            <div className="flex bg-[var(--stitch-background)] rounded-lg p-1 border border-[var(--stitch-border)]">
                                <button
                                    className={clsx(
                                        "flex-1 py-1.5 text-xs font-medium rounded transition-colors",
                                        watermark.type === 'text'
                                            ? "bg-[var(--stitch-surface)] shadow-sm text-[var(--stitch-text-primary)]"
                                            : "text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-secondary)]"
                                    )}
                                    onClick={() => setWatermark({ type: 'text' })}
                                >
                                    Text
                                </button>
                                <button
                                    className={clsx(
                                        "flex-1 py-1.5 text-xs font-medium rounded transition-colors",
                                        watermark.type === 'image'
                                            ? "bg-[var(--stitch-surface)] shadow-sm text-[var(--stitch-text-primary)]"
                                            : "text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-secondary)]"
                                    )}
                                    onClick={() => setWatermark({ type: 'image' })}
                                >
                                    Image
                                </button>
                            </div>

                            {/* Text Watermark */}
                            {watermark.type === 'text' && (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={watermark.text}
                                        onChange={(e) => setWatermark({ text: e.target.value })}
                                        placeholder="Enter watermark text"
                                        className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:border-[var(--stitch-primary)] focus:outline-none"
                                    />
                                    <StitchSlider
                                        label={`Font Size: ${watermark.fontSize}px`}
                                        min={12}
                                        max={200}
                                        value={watermark.fontSize}
                                        onChange={(value) => setWatermark({ fontSize: value })}
                                        showValue={false}
                                    />
                                </div>
                            )}

                            {/* Image Watermark */}
                            {watermark.type === 'image' && (
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        ref={watermarkImageRef}
                                        accept="image/*"
                                        onChange={handleWatermarkImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        className="w-full flex items-center justify-center gap-2 p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-lg text-xs font-medium text-[var(--stitch-text-primary)] hover:border-[var(--stitch-primary)] transition-colors"
                                        onClick={() => watermarkImageRef.current?.click()}
                                    >
                                        <Upload size={14} /> Upload Logo/Image
                                    </button>
                                    {watermark.image && (
                                        <div className="relative w-full h-24 bg-[var(--stitch-background)] rounded-lg border border-[var(--stitch-border)] flex items-center justify-center overflow-hidden">
                                            <img src={watermark.image} alt="Watermark" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Position Grid */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Position</label>
                                <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
                                    {(['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            className={clsx(
                                                "w-7 h-7 rounded border flex items-center justify-center transition-colors",
                                                watermark.position === pos
                                                    ? "bg-[var(--stitch-primary-light)] border-[var(--stitch-primary)]"
                                                    : "bg-[var(--stitch-background)] border-[var(--stitch-border)] hover:bg-[var(--stitch-surface-hover)]"
                                            )}
                                            onClick={() => setWatermark({ position: pos })}
                                            title={pos}
                                        >
                                            <div className={clsx(
                                                "w-2 h-2 rounded-full",
                                                watermark.position === pos ? "bg-[var(--stitch-primary)]" : "bg-[var(--stitch-text-tertiary)]"
                                            )} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <StitchSlider
                                label={`Opacity: ${Math.round(watermark.opacity * 100)}%`}
                                min={5}
                                max={100}
                                value={watermark.opacity * 100}
                                onChange={(value) => setWatermark({ opacity: value / 100 })}
                            />

                            <StitchSlider
                                label={`Size: ${Math.round(watermark.scale * 100)}%`}
                                min={10}
                                max={300}
                                value={watermark.scale * 100}
                                onChange={(value) => setWatermark({ scale: value / 100 })}
                            />

                            <StitchSlider
                                label={`Rotation: ${watermark.rotation}°`}
                                min={-180}
                                max={180}
                                value={watermark.rotation}
                                onChange={(value) => setWatermark({ rotation: value })}
                            />

                            <label className="flex items-center gap-2 text-xs text-[var(--stitch-text-primary)] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={watermark.tiling}
                                    onChange={(e) => setWatermark({ tiling: e.target.checked })}
                                    className="w-3 h-3 rounded border-gray-300 text-[var(--stitch-primary)]"
                                />
                                Tile across canvas
                            </label>

                            <button
                                className="w-full py-2 bg-[var(--stitch-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--stitch-primary-hover)] transition-colors shadow-sm"
                                onClick={applyWatermark}
                            >
                                Apply Watermark
                            </button>
                        </>
                    )}
                </div>
            </StitchAccordion>

            {/* Clear Background */}
            <div className="p-4">
                <button
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors"
                    onClick={clearBackground}
                    disabled={backgroundLocked}
                >
                    <Trash2 size={16} /> Clear Background
                </button>
            </div>
        </div>
    );
};
