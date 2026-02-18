import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { StitchColorPicker } from '../common/StitchColorPicker';
import { StitchButton } from '../common/StitchButton';
import { Palette, Droplet, Image as ImageIcon, Lock, Unlock, Eraser, Stamp } from 'lucide-react';

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
        <div className="flex items-center gap-4 px-4 h-full w-full">
            {/* Background Type */}
            <div className="flex items-center gap-1">
                <StitchButton
                    size="sm"
                    variant={backgroundType === 'solid' ? 'primary' : 'ghost'}
                    onClick={() => setBackgroundType('solid')}
                    disabled={backgroundLocked}
                    title="Solid Color"
                >
                    <Palette size={14} className="mr-2" /> Solid
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={backgroundType === 'gradient' ? 'primary' : 'ghost'}
                    onClick={() => setBackgroundType('gradient')}
                    disabled={backgroundLocked}
                    title="Gradient"
                >
                    <Droplet size={14} className="mr-2" /> Gradient
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={backgroundType === 'image' ? 'primary' : 'ghost'}
                    onClick={() => setBackgroundType('image')}
                    disabled={backgroundLocked}
                    title="Image"
                >
                    <ImageIcon size={14} className="mr-2" /> Image
                </StitchButton>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Quick Color */}
            {backgroundType === 'solid' && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--stitch-text-tertiary)] uppercase font-semibold">Color</span>
                    <StitchColorPicker
                        color={backgroundColor}
                        onChange={handleColorChange}
                    />
                </div>
            )}

            {backgroundType === 'solid' && <div className="w-px h-6 bg-[var(--stitch-border)]" />}

            {/* Watermark Toggle */}
            <div className="flex items-center">
                <StitchButton
                    size="sm"
                    variant={watermark.enabled ? 'primary' : 'ghost'}
                    onClick={() => setWatermark({ enabled: !watermark.enabled })}
                    title="Toggle Watermark"
                >
                    <Stamp size={14} className="mr-2" /> Watermark
                </StitchButton>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Lock and Reset */}
            <div className="flex items-center gap-1 relative">
                <StitchButton
                    size="sm"
                    variant={backgroundLocked ? 'secondary' : 'ghost'}
                    onClick={() => setBackgroundLocked(!backgroundLocked)}
                    title={backgroundLocked ? 'Unlock Background' : 'Lock Background'}
                    className={backgroundLocked ? '!text-red-400 !bg-red-900/10' : ''}
                >
                    {backgroundLocked ? <Lock size={14} className="mr-2" /> : <Unlock size={14} className="mr-2" />}
                    {backgroundLocked ? 'Locked' : 'Lock'}
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant="ghost"
                    onClick={handleClear}
                    title="Clear Background"
                    disabled={backgroundLocked}
                >
                    <Eraser size={14} className="mr-2" /> Clear
                </StitchButton>
            </div>
        </div>
    );
};
