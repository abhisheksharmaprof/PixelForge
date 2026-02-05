import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { FaLock, FaLockOpen, FaUpload, FaTrash, FaTimes, FaStamp } from 'react-icons/fa';
import './BackgroundProperties.css';

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
        <div className="background-properties">
            <div className="properties-header">
                <h3>Background</h3>
                <button
                    className={`lock-btn ${backgroundLocked ? 'locked' : ''}`}
                    onClick={() => setBackgroundLocked(!backgroundLocked)}
                    title={backgroundLocked ? 'Unlock background' : 'Lock background'}
                >
                    {backgroundLocked ? <FaLock /> : <FaLockOpen />}
                </button>
            </div>

            {/* Background Type */}
            <div className="property-group">
                <label>Type</label>
                <div className="type-selector">
                    {(['solid', 'gradient', 'image', 'transparent'] as const).map(type => (
                        <button
                            key={type}
                            className={backgroundType === type ? 'active' : ''}
                            onClick={() => setBackgroundType(type)}
                            disabled={backgroundLocked}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Solid Color Options */}
            {backgroundType === 'solid' && (
                <div className="property-group">
                    <label>Color</label>
                    <div className="color-input-row">
                        <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            disabled={backgroundLocked}
                        />
                        <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            disabled={backgroundLocked}
                        />
                    </div>
                </div>
            )}

            {/* Gradient Options */}
            {backgroundType === 'gradient' && (
                <>
                    <div className="property-group">
                        <label>Gradient Type</label>
                        <select
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
                    <div className="property-group">
                        <label>Angle: {backgroundGradient.angle}°</label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={backgroundGradient.angle}
                            onChange={(e) => {
                                setBackgroundGradient({ angle: parseInt(e.target.value) });
                                setTimeout(applyGradient, 0);
                            }}
                            disabled={backgroundLocked}
                        />
                    </div>
                    <div className="property-group">
                        <label>Colors</label>
                        <div className="gradient-colors">
                            {backgroundGradient.stops.map((stop, index) => (
                                <input
                                    key={index}
                                    type="color"
                                    value={stop.color}
                                    onChange={(e) => handleGradientColorChange(index, e.target.value)}
                                    disabled={backgroundLocked}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Image Options */}
            {backgroundType === 'image' && (
                <>
                    <div className="property-group">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={backgroundLocked}
                        >
                            <FaUpload /> Upload Image
                        </button>
                    </div>
                    {backgroundImage && (
                        <>
                            <div className="property-group">
                                <label>Fit Mode</label>
                                <select
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
                            <div className="property-group">
                                <label>Opacity: {Math.round(backgroundImageOpacity * 100)}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={backgroundImageOpacity * 100}
                                    onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
                                    disabled={backgroundLocked}
                                />
                            </div>
                            <div className="property-group">
                                <label>Rotation: {backgroundImageRotation}°</label>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={backgroundImageRotation}
                                    onChange={(e) => handleRotationChange(parseInt(e.target.value))}
                                    disabled={backgroundLocked}
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Background Effects (for image type) */}
            {backgroundType === 'image' && backgroundImage && (
                <div className="property-group">
                    <label>Effects</label>
                    <div className="effect-sliders">
                        <div className="effect-row">
                            <span>Blur</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={backgroundEffects.blur}
                                onChange={(e) => handleEffectChange('blur', parseInt(e.target.value))}
                                disabled={backgroundLocked}
                            />
                            <span>{backgroundEffects.blur}%</span>
                        </div>
                        <div className="effect-row">
                            <span>Brightness</span>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={backgroundEffects.brightness}
                                onChange={(e) => handleEffectChange('brightness', parseInt(e.target.value))}
                                disabled={backgroundLocked}
                            />
                            <span>{backgroundEffects.brightness}</span>
                        </div>
                        <div className="effect-row">
                            <span>Contrast</span>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={backgroundEffects.contrast}
                                onChange={(e) => handleEffectChange('contrast', parseInt(e.target.value))}
                                disabled={backgroundLocked}
                            />
                            <span>{backgroundEffects.contrast}</span>
                        </div>
                        <div className="effect-row">
                            <span>Saturation</span>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={backgroundEffects.saturation}
                                onChange={(e) => handleEffectChange('saturation', parseInt(e.target.value))}
                                disabled={backgroundLocked}
                            />
                            <span>{backgroundEffects.saturation}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Watermark Section */}
            <div className="property-group watermark-section">
                <label><FaStamp /> Watermark</label>
                <div className="watermark-toggle-row">
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={watermark.enabled}
                            onChange={(e) => setWatermark({ enabled: e.target.checked })}
                        />
                        <span>Enable Watermark</span>
                    </label>
                    {watermark.enabled && (
                        <button className="remove-watermark-btn" onClick={removeWatermark} title="Remove Watermark">
                            <FaTimes />
                        </button>
                    )}
                </div>

                {watermark.enabled && (
                    <div className="watermark-options">
                        {/* Watermark Type */}
                        <div className="wm-type-row">
                            <button
                                className={watermark.type === 'text' ? 'active' : ''}
                                onClick={() => setWatermark({ type: 'text' })}
                            >
                                Text
                            </button>
                            <button
                                className={watermark.type === 'image' ? 'active' : ''}
                                onClick={() => setWatermark({ type: 'image' })}
                            >
                                Image
                            </button>
                        </div>

                        {/* Text Watermark */}
                        {watermark.type === 'text' && (
                            <>
                                <input
                                    type="text"
                                    value={watermark.text}
                                    onChange={(e) => setWatermark({ text: e.target.value })}
                                    placeholder="Enter watermark text"
                                    className="wm-text-input"
                                />
                                <div className="wm-row">
                                    <label>Font Size: {watermark.fontSize}px</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="200"
                                        value={watermark.fontSize}
                                        onChange={(e) => setWatermark({ fontSize: parseInt(e.target.value) })}
                                    />
                                </div>
                            </>
                        )}

                        {/* Image Watermark */}
                        {watermark.type === 'image' && (
                            <div className="wm-image-section">
                                <input
                                    type="file"
                                    ref={watermarkImageRef}
                                    accept="image/*"
                                    onChange={handleWatermarkImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="wm-upload-btn"
                                    onClick={() => watermarkImageRef.current?.click()}
                                >
                                    <FaUpload /> Upload Logo/Image
                                </button>
                                {watermark.image && (
                                    <img src={watermark.image} alt="Watermark" className="wm-preview" />
                                )}
                            </div>
                        )}

                        {/* Position Grid */}
                        <div className="wm-row">
                            <label>Position</label>
                            <div className="wm-position-grid">
                                {(['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'] as const).map(pos => (
                                    <button
                                        key={pos}
                                        className={watermark.position === pos ? 'active' : ''}
                                        onClick={() => setWatermark({ position: pos })}
                                        title={pos}
                                    >
                                        <span className="pos-dot"></span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Opacity */}
                        <div className="wm-row">
                            <label>Opacity: {Math.round(watermark.opacity * 100)}%</label>
                            <input
                                type="range"
                                min="5"
                                max="100"
                                value={watermark.opacity * 100}
                                onChange={(e) => setWatermark({ opacity: parseInt(e.target.value) / 100 })}
                            />
                        </div>

                        {/* Scale */}
                        <div className="wm-row">
                            <label>Size: {Math.round(watermark.scale * 100)}%</label>
                            <input
                                type="range"
                                min="10"
                                max="300"
                                value={watermark.scale * 100}
                                onChange={(e) => setWatermark({ scale: parseInt(e.target.value) / 100 })}
                            />
                        </div>

                        {/* Rotation */}
                        <div className="wm-row">
                            <label>Rotation: {watermark.rotation}°</label>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={watermark.rotation}
                                onChange={(e) => setWatermark({ rotation: parseInt(e.target.value) })}
                            />
                        </div>

                        {/* Tiling */}
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={watermark.tiling}
                                onChange={(e) => setWatermark({ tiling: e.target.checked })}
                            />
                            <span>Tile across canvas</span>
                        </label>

                        {/* Apply Button */}
                        <button className="apply-watermark-btn" onClick={applyWatermark}>
                            Apply Watermark
                        </button>
                    </div>
                )}
            </div>

            {/* Clear Background */}
            <div className="property-group">
                <button
                    className="clear-btn"
                    onClick={clearBackground}
                    disabled={backgroundLocked}
                >
                    <FaTrash /> Clear Background
                </button>
            </div>
        </div>
    );
};
