import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { FaPalette, FaTint, FaImage, FaLock, FaLockOpen, FaUndo, FaStamp } from 'react-icons/fa';
import './BackgroundRibbon.css';

export const BackgroundRibbon: React.FC = () => {
    const {
        canvas,
        backgroundType,
        setBackgroundType,
        backgroundColor,
        setBackgroundColor,
        backgroundLocked,
        setBackgroundLocked,
        watermark,
        setWatermark,
    } = useCanvasStore();

    const handleColorChange = (color: string) => {
        setBackgroundType('solid');
        setBackgroundColor(color);
        if (canvas) {
            canvas.setBackgroundColor(color, () => canvas.renderAll());
        }
    };

    const handleClear = () => {
        setBackgroundType('transparent');
        if (canvas) {
            canvas.setBackgroundColor('', () => {
                canvas.setBackgroundImage(null as any, () => canvas.renderAll());
            });
        }
    };

    return (
        <div className="contextual-ribbon background-ribbon">
            {/* Background Type */}
            <div className="ribbon-group">
                <button
                    className={`ribbon-btn ${backgroundType === 'solid' ? 'active' : ''}`}
                    onClick={() => setBackgroundType('solid')}
                    title="Solid Color"
                    disabled={backgroundLocked}
                >
                    <FaPalette />
                    <span>Solid</span>
                </button>
                <button
                    className={`ribbon-btn ${backgroundType === 'gradient' ? 'active' : ''}`}
                    onClick={() => setBackgroundType('gradient')}
                    title="Gradient"
                    disabled={backgroundLocked}
                >
                    <FaTint />
                    <span>Gradient</span>
                </button>
                <button
                    className={`ribbon-btn ${backgroundType === 'image' ? 'active' : ''}`}
                    onClick={() => setBackgroundType('image')}
                    title="Image"
                    disabled={backgroundLocked}
                >
                    <FaImage />
                    <span>Image</span>
                </button>
            </div>

            <div className="ribbon-divider"></div>

            {/* Quick Color */}
            {backgroundType === 'solid' && (
                <div className="ribbon-group">
                    <label className="ribbon-label">Color</label>
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="ribbon-color-picker"
                        disabled={backgroundLocked}
                    />
                </div>
            )}

            <div className="ribbon-divider"></div>

            {/* Watermark Toggle */}
            <div className="ribbon-group">
                <button
                    className={`ribbon-btn ${watermark.enabled ? 'active' : ''}`}
                    onClick={() => setWatermark({ enabled: !watermark.enabled })}
                    title="Toggle Watermark"
                >
                    <FaStamp />
                    <span>Watermark</span>
                </button>
            </div>

            <div className="ribbon-divider"></div>

            {/* Lock and Reset */}
            <div className="ribbon-group">
                <button
                    className={`ribbon-btn ${backgroundLocked ? 'locked' : ''}`}
                    onClick={() => setBackgroundLocked(!backgroundLocked)}
                    title={backgroundLocked ? 'Unlock Background' : 'Lock Background'}
                >
                    {backgroundLocked ? <FaLock /> : <FaLockOpen />}
                    <span>{backgroundLocked ? 'Locked' : 'Lock'}</span>
                </button>
                <button
                    className="ribbon-btn"
                    onClick={handleClear}
                    title="Clear Background"
                    disabled={backgroundLocked}
                >
                    <FaUndo />
                    <span>Clear</span>
                </button>
            </div>
        </div>
    );
};
