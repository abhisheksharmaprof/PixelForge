import React, { useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { FaPalette, FaImage, FaTint, FaUpload, FaStamp } from 'react-icons/fa';
import './BackgroundTab.css';

// Preset solid colors
const presetColors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da',
    '#ff6b6b', '#fa5252', '#e03131', '#c92a2a', '#a51d1d',
    '#ff922b', '#fd7e14', '#e67700', '#cc6a00', '#b35f00',
    '#ffd43b', '#fab005', '#f59f00', '#e67700', '#cc6a00',
    '#69db7c', '#51cf66', '#40c057', '#2f9e44', '#228b22',
    '#4dabf7', '#339af0', '#228be6', '#1c7ed6', '#1864ab',
    '#7950f2', '#6741d9', '#5f3dc4', '#5030a6', '#40278a',
    '#f06595', '#e64980', '#d6336c', '#c2255c', '#a6194e',
    '#000000', '#212529', '#343a40', '#495057', '#6c757d',
];

// Preset gradients
const presetGradients = [
    { stops: [{ color: '#667eea', offset: 0 }, { color: '#764ba2', offset: 1 }], angle: 135 },
    { stops: [{ color: '#f093fb', offset: 0 }, { color: '#f5576c', offset: 1 }], angle: 135 },
    { stops: [{ color: '#4facfe', offset: 0 }, { color: '#00f2fe', offset: 1 }], angle: 135 },
    { stops: [{ color: '#43e97b', offset: 0 }, { color: '#38f9d7', offset: 1 }], angle: 135 },
    { stops: [{ color: '#fa709a', offset: 0 }, { color: '#fee140', offset: 1 }], angle: 135 },
    { stops: [{ color: '#30cfd0', offset: 0 }, { color: '#330867', offset: 1 }], angle: 135 },
    { stops: [{ color: '#a8edea', offset: 0 }, { color: '#fed6e3', offset: 1 }], angle: 135 },
    { stops: [{ color: '#5ee7df', offset: 0 }, { color: '#b490ca', offset: 1 }], angle: 135 },
    { stops: [{ color: '#d299c2', offset: 0 }, { color: '#fef9d7', offset: 1 }], angle: 135 },
    { stops: [{ color: '#eea2a2', offset: 0 }, { color: '#bbc1bf', offset: 0.5 }, { color: '#57c6e1', offset: 1 }], angle: 135 },
];

export const BackgroundTab: React.FC = () => {
    const {
        canvas,
        backgroundType,
        setBackgroundType,
        backgroundColor,
        setBackgroundColor,
        backgroundGradient,
        setBackgroundGradient,
        setBackgroundImage,
        watermark,
        setWatermark,
    } = useCanvasStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleColorClick = (color: string) => {
        setBackgroundType('solid');
        setBackgroundColor(color);
        if (canvas) {
            canvas.setBackgroundColor(color, () => {
                canvas.renderAll();
            });
        }
    };

    const handleGradientClick = (gradient: typeof presetGradients[0]) => {
        setBackgroundType('gradient');
        setBackgroundGradient({
            type: 'linear',
            angle: gradient.angle,
            stops: gradient.stops
        });

        if (canvas) {
            const gradientObj = new (window as any).fabric.Gradient({
                type: 'linear',
                coords: {
                    x1: 0,
                    y1: 0,
                    x2: canvas.width || 800,
                    y2: canvas.height || 600
                },
                colorStops: gradient.stops.map(s => ({
                    offset: s.offset,
                    color: s.color
                }))
            });
            canvas.setBackgroundColor(gradientObj, () => {
                canvas.renderAll();
            });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setBackgroundType('image');
            setBackgroundImage(dataUrl);

            (window as any).fabric.Image.fromURL(dataUrl, (img: any) => {
                const canvasWidth = canvas.width || 800;
                const canvasHeight = canvas.height || 600;

                img.scaleToWidth(canvasWidth);
                if (img.getScaledHeight() < canvasHeight) {
                    img.scaleToHeight(canvasHeight);
                }

                canvas.setBackgroundImage(img, () => {
                    canvas.renderAll();
                });
            });
        };
        reader.readAsDataURL(file);
    };

    const handleTransparent = () => {
        setBackgroundType('transparent');
        if (canvas) {
            canvas.setBackgroundColor('', () => {
                canvas.setBackgroundImage(null as any, () => {
                    canvas.renderAll();
                });
            });
        }
    };

    const handleWatermarkToggle = () => {
        setWatermark({ enabled: !watermark.enabled });
    };

    const gradientToCSS = (stops: { color: string; offset: number }[], angle: number) => {
        const colorStops = stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ');
        return `linear-gradient(${angle}deg, ${colorStops})`;
    };

    return (
        <div className="background-tab sidebar-tab-content">
            <div className="sidebar-header">
                <h3>Background</h3>
            </div>

            {/* Background Type Quick Actions */}
            <div className="bg-section">
                <h4>Quick Actions</h4>
                <div className="bg-quick-actions">
                    <button
                        className={`bg-action-btn ${backgroundType === 'solid' ? 'active' : ''}`}
                        onClick={() => handleColorClick(backgroundColor)}
                    >
                        <FaPalette />
                        <span>Solid</span>
                    </button>
                    <button
                        className={`bg-action-btn ${backgroundType === 'gradient' ? 'active' : ''}`}
                        onClick={() => handleGradientClick(presetGradients[0])}
                    >
                        <FaTint />
                        <span>Gradient</span>
                    </button>
                    <button
                        className={`bg-action-btn ${backgroundType === 'image' ? 'active' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FaImage />
                        <span>Image</span>
                    </button>
                    <button
                        className={`bg-action-btn ${backgroundType === 'transparent' ? 'active' : ''}`}
                        onClick={handleTransparent}
                    >
                        <span className="transparent-icon">⊘</span>
                        <span>None</span>
                    </button>
                </div>
            </div>

            {/* Solid Colors */}
            <div className="bg-section">
                <h4>Solid Colors</h4>
                <div className="color-grid">
                    {presetColors.map((color, index) => (
                        <button
                            key={index}
                            className={`color-swatch ${backgroundColor === color && backgroundType === 'solid' ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorClick(color)}
                            title={color}
                        />
                    ))}
                </div>
                <div className="custom-color-row">
                    <label>Custom Color</label>
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => handleColorClick(e.target.value)}
                    />
                    <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => handleColorClick(e.target.value)}
                        placeholder="#ffffff"
                    />
                </div>
            </div>

            {/* Gradients */}
            <div className="bg-section">
                <h4>Gradients</h4>
                <div className="gradient-grid">
                    {presetGradients.map((gradient, index) => (
                        <button
                            key={index}
                            className="gradient-swatch"
                            style={{ background: gradientToCSS(gradient.stops, gradient.angle) }}
                            onClick={() => handleGradientClick(gradient)}
                            title="Apply gradient"
                        />
                    ))}
                </div>
            </div>

            {/* Image Upload */}
            <div className="bg-section">
                <h4>Background Image</h4>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />
                <button className="upload-bg-btn" onClick={() => fileInputRef.current?.click()}>
                    <FaUpload />
                    <span>Upload Image</span>
                </button>
            </div>

            {/* Watermark */}
            <div className="bg-section">
                <h4>Watermark</h4>
                <div className="watermark-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={watermark.enabled}
                            onChange={handleWatermarkToggle}
                        />
                        <span>Enable Watermark</span>
                    </label>
                </div>
                {watermark.enabled && (
                    <div className="watermark-options">
                        <div className="watermark-type-btns">
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
                        {watermark.type === 'text' && (
                            <input
                                type="text"
                                value={watermark.text}
                                onChange={(e) => setWatermark({ text: e.target.value })}
                                placeholder="Watermark text"
                                className="watermark-text-input"
                            />
                        )}
                        <div className="watermark-slider">
                            <label>Opacity: {Math.round(watermark.opacity * 100)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={watermark.opacity * 100}
                                onChange={(e) => setWatermark({ opacity: parseInt(e.target.value) / 100 })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
