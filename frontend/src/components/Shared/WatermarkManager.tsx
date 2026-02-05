import React, { useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { FaTimes, FaUpload } from 'react-icons/fa';
import './WatermarkManager.css';

interface WatermarkManagerProps {
    onClose: () => void;
}

const positionLabels = {
    tl: 'Top Left',
    tc: 'Top Center',
    tr: 'Top Right',
    ml: 'Middle Left',
    mc: 'Center',
    mr: 'Middle Right',
    bl: 'Bottom Left',
    bc: 'Bottom Center',
    br: 'Bottom Right',
};

export const WatermarkManager: React.FC<WatermarkManagerProps> = ({ onClose }) => {
    const { watermark, setWatermark, canvas, canvasSize } = useCanvasStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setWatermark({
                type: 'image',
                image: event.target?.result as string
            });
        };
        reader.readAsDataURL(file);
    };

    const applyWatermark = () => {
        if (!canvas) return;

        // Remove existing watermark if any
        const existingWatermarks = canvas.getObjects().filter((obj: any) => obj.isWatermark);
        existingWatermarks.forEach(obj => canvas.remove(obj));

        if (!watermark.enabled) {
            canvas.renderAll();
            return;
        }

        const { position, opacity, rotation, scale, tiling } = watermark;
        const cw = canvasSize.width;
        const ch = canvasSize.height;

        // Calculate position
        const posMap: Record<string, { x: number; y: number }> = {
            tl: { x: cw * 0.1, y: ch * 0.1 },
            tc: { x: cw * 0.5, y: ch * 0.1 },
            tr: { x: cw * 0.9, y: ch * 0.1 },
            ml: { x: cw * 0.1, y: ch * 0.5 },
            mc: { x: cw * 0.5, y: ch * 0.5 },
            mr: { x: cw * 0.9, y: ch * 0.5 },
            bl: { x: cw * 0.1, y: ch * 0.9 },
            bc: { x: cw * 0.5, y: ch * 0.9 },
            br: { x: cw * 0.9, y: ch * 0.9 },
        };

        const pos = posMap[position] || posMap.mc;

        if (watermark.type === 'text') {
            const text = new (window as any).fabric.Text(watermark.text, {
                left: pos.x,
                top: pos.y,
                originX: 'center',
                originY: 'center',
                fontFamily: watermark.fontFamily,
                fontSize: watermark.fontSize * scale,
                fill: `rgba(128, 128, 128, ${opacity})`,
                angle: rotation,
                selectable: false,
                evented: false,
            });
            (text as any).isWatermark = true;

            if (tiling) {
                // Create tiled pattern
                for (let y = 0; y < ch; y += 200) {
                    for (let x = 0; x < cw; x += 300) {
                        const tileCopy = text.clone((cloned: any) => {
                            cloned.set({ left: x + 50, top: y + 50 });
                            cloned.isWatermark = true;
                            canvas.add(cloned);
                        });
                    }
                }
            } else {
                canvas.add(text);
            }
        } else if (watermark.type === 'image' && watermark.image) {
            (window as any).fabric.Image.fromURL(watermark.image, (img: any) => {
                img.set({
                    left: pos.x,
                    top: pos.y,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale * 0.5,
                    scaleY: scale * 0.5,
                    opacity: opacity,
                    angle: rotation,
                    selectable: false,
                    evented: false,
                });
                img.isWatermark = true;
                canvas.add(img);
                canvas.renderAll();
            });
        }

        canvas.renderAll();
    };

    return (
        <div className="watermark-manager-overlay">
            <div className="watermark-manager">
                <div className="wm-header">
                    <h3>Watermark Settings</h3>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="wm-content">
                    {/* Enable Toggle */}
                    <div className="wm-row">
                        <label className="wm-toggle">
                            <input
                                type="checkbox"
                                checked={watermark.enabled}
                                onChange={(e) => setWatermark({ enabled: e.target.checked })}
                            />
                            <span>Enable Watermark</span>
                        </label>
                    </div>

                    {watermark.enabled && (
                        <>
                            {/* Type Selection */}
                            <div className="wm-row">
                                <label>Type</label>
                                <div className="wm-type-btns">
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
                            </div>

                            {/* Text Options */}
                            {watermark.type === 'text' && (
                                <div className="wm-row">
                                    <label>Text</label>
                                    <input
                                        type="text"
                                        value={watermark.text}
                                        onChange={(e) => setWatermark({ text: e.target.value })}
                                        placeholder="Enter watermark text"
                                    />
                                </div>
                            )}

                            {/* Image Upload */}
                            {watermark.type === 'image' && (
                                <div className="wm-row">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        className="wm-upload-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FaUpload /> Upload Logo
                                    </button>
                                    {watermark.image && (
                                        <img
                                            src={watermark.image}
                                            alt="Watermark preview"
                                            className="wm-preview"
                                        />
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
                                            title={positionLabels[pos]}
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
                                    min="0"
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
                            <div className="wm-row">
                                <label className="wm-toggle">
                                    <input
                                        type="checkbox"
                                        checked={watermark.tiling}
                                        onChange={(e) => setWatermark({ tiling: e.target.checked })}
                                    />
                                    <span>Tile across canvas</span>
                                </label>
                            </div>
                        </>
                    )}
                </div>

                <div className="wm-actions">
                    <button className="wm-apply-btn" onClick={applyWatermark}>
                        Apply Watermark
                    </button>
                    <button className="wm-cancel-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
