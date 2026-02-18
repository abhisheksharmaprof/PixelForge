import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { StitchModal } from '../common/StitchModal';
import { StitchButton } from '../common/StitchButton';
import { fabric } from 'fabric';

const EFFECT_PRESETS = [
    {
        id: 'neon',
        name: 'Neon',
        styles: {
            fill: '#00ff00',
            stroke: '#003300',
            strokeWidth: 1,
            shadow: new fabric.Shadow({ color: '#00ff00', blur: 20, offsetX: 0, offsetY: 0 })
        },
        previewBg: '#000000',
        previewColor: '#00ff00'
    },
    {
        id: 'retro',
        name: 'Retro',
        styles: {
            fill: '#FFD700',
            stroke: '#FF69B4',
            strokeWidth: 2,
            shadow: new fabric.Shadow({ color: '#000000', blur: 0, offsetX: 3, offsetY: 3 })
        },
        previewBg: '#4B5563',
        previewColor: '#FFD700'
    },
    {
        id: 'outline',
        name: 'Outline',
        styles: {
            fill: 'transparent',
            stroke: '#ffffff',
            strokeWidth: 2,
            shadow: undefined
        },
        previewBg: '#000000',
        previewColor: 'transparent'
    },
    {
        id: 'glow',
        name: 'Soft Glow',
        styles: {
            fill: '#ffffff',
            stroke: undefined,
            shadow: new fabric.Shadow({ color: '#ffffff', blur: 15, offsetX: 0, offsetY: 0 })
        },
        previewBg: '#374151',
        previewColor: '#ffffff'
    },
    {
        id: 'lifted',
        name: 'Lifted',
        styles: {
            fill: '#333333',
            stroke: undefined,
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 10 })
        },
        previewBg: '#E5E7EB',
        previewColor: '#333333'
    },
    {
        id: 'echo',
        name: 'Echo (Simple)', // Fabric only supports 1 shadow, assume complex handled via cloned objects elsewhere, here simple offset
        styles: {
            fill: '#3B82F6',
            stroke: undefined,
            shadow: new fabric.Shadow({ color: 'rgba(59, 130, 246, 0.5)', blur: 0, offsetX: 4, offsetY: 4 })
        },
        previewBg: '#EFF6FF',
        previewColor: '#3B82F6'
    },
    {
        id: 'curved',
        name: 'Curved (Coming Soon)',
        styles: {
            fill: '#8B5CF6',
            stroke: undefined,
            shadow: undefined
        },
        previewBg: '#F3F4F6',
        previewColor: '#8B5CF6'
    }
];

export const TextEffectsLibraryModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { canvas } = useCanvasStore();
    const isOpen = activeModal === 'textEffectsLibrary';

    if (!isOpen) return null;

    const handleApplyEffect = (preset: typeof EFFECT_PRESETS[0]) => {
        if (preset.id === 'curved') {
            useUIStore.getState().addNotification({
                type: 'info',
                message: 'Curved text text-on-path is coming in v2!',
                duration: 2000
            });
            closeModal();
            return;
        }

        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'textbox')) {
            // Apply text styles
            activeObj.set(preset.styles);
            canvas.requestRenderAll();
            closeModal();
        } else {
            // Create new text with this effect
            const text = new fabric.IText(preset.name, {
                left: canvas.width ? canvas.width / 2 : 100,
                top: canvas.height ? canvas.height / 2 : 100,
                fontSize: 60,
                fontFamily: 'Impact',
                ...preset.styles
            });
            canvas.add(text);
            canvas.setActiveObject(text);
            canvas.requestRenderAll();
            closeModal();
        }
    };

    return (
        <StitchModal
            isOpen={isOpen}
            onClose={() => closeModal()}
            title="Text Effects Library"
            size="lg"
        >
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                {EFFECT_PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => handleApplyEffect(preset)}
                        className="group relative aspect-video rounded-lg overflow-hidden border border-[var(--stitch-border)] hover:border-[var(--stitch-primary)] transition-all flex items-center justify-center"
                        style={{ backgroundColor: preset.previewBg }}
                    >
                        <div
                            className="text-2xl font-bold"
                            style={{
                                color: preset.styles.fill as string,
                                WebkitTextStroke: preset.styles.stroke ? `${preset.styles.strokeWidth}px ${preset.styles.stroke}` : 'none',
                                textShadow: preset.styles.shadow ?
                                    `${(preset.styles.shadow as any).offsetX}px ${(preset.styles.shadow as any).offsetY}px ${(preset.styles.shadow as any).blur}px ${(preset.styles.shadow as any).color}`
                                    : 'none'
                            }}
                        >
                            {preset.name}
                        </div>
                        <div className="absolute inset-0 bg-black/opacity-0 group-hover:bg-black/10 transition-colors" />
                    </button>
                ))}
            </div>
            <div className="p-4 border-t border-[var(--stitch-border)] flex justify-end">
                <StitchButton variant="ghost" onClick={() => closeModal()}>Cancel</StitchButton>
            </div>
        </StitchModal>
    );
};
