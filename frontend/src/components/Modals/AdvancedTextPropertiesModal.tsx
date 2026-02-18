import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useCanvasStore } from '../../store/canvasStore';
import { StitchModal } from '../common/StitchModal';
import { StitchButton } from '../common/StitchButton';
import { StitchColorPicker } from '../common/StitchColorPicker';
import { StitchSlider } from '../common/StitchSlider';
import { fabric } from 'fabric';

export const AdvancedTextPropertiesModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { selectedObjects } = useSelectionStore();
    const { canvas } = useCanvasStore();
    const [activeTab, setActiveTab] = useState<'style' | 'effects'>('style');

    const isOpen = activeModal === 'advancedTextProperties';
    const textObj = selectedObjects[0] as fabric.Textbox;

    if (!isOpen || !textObj) return null;

    const handleUpdate = (updates: any) => {
        textObj.set(updates);
        canvas?.renderAll();
        // Force update logic if needed
    };

    const shadow = textObj.shadow as fabric.Shadow;
    const shadowColor = shadow ? shadow.color : '#000000';
    const shadowBlur = shadow ? shadow.blur : 0;
    const shadowOffsetX = shadow ? shadow.offsetX : 0;
    const shadowOffsetY = shadow ? shadow.offsetY : 0;

    return (
        <StitchModal
            isOpen={isOpen}
            onClose={closeModal}
            title="Advanced Text Properties"
            size="lg"
            footer={
                <div className="flex justify-end gap-2">
                    <StitchButton variant="secondary" onClick={closeModal}>Close</StitchButton>
                </div>
            }
        >
            <div className="flex flex-col h-[400px]">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-[var(--stitch-border)] mb-4">
                    <button
                        className={`pb-2 text-sm font-medium ${activeTab === 'style' ? 'text-[var(--stitch-primary)] border-b-2 border-[var(--stitch-primary)]' : 'text-[var(--stitch-text-secondary)]'}`}
                        onClick={() => setActiveTab('style')}
                    >
                        Typography & Layout
                    </button>
                    <button
                        className={`pb-2 text-sm font-medium ${activeTab === 'effects' ? 'text-[var(--stitch-primary)] border-b-2 border-[var(--stitch-primary)]' : 'text-[var(--stitch-text-secondary)]'}`}
                        onClick={() => setActiveTab('effects')}
                    >
                        Effects & Decoration
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'style' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Font Metrics</h4>
                                <div className="space-y-2">
                                    <label className="text-xs text-[var(--stitch-text-secondary)]">Line Height</label>
                                    <StitchSlider
                                        min={0.5} max={3} step={0.05}
                                        value={textObj.lineHeight || 1.16}
                                        onChange={(v) => handleUpdate({ lineHeight: v })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-[var(--stitch-text-secondary)]">Char Spacing</label>
                                    <StitchSlider
                                        min={-100} max={500} step={10}
                                        value={textObj.charSpacing || 0}
                                        onChange={(v) => handleUpdate({ charSpacing: v })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Box Model</h4>
                                <div className="p-3 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded text-xs">
                                    <p>Detailed box metrics (padding, border) are limited in standard Fabric.js Textbox customization without subclassing.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'effects' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Stroke (Outline)</h4>
                                <StitchColorPicker
                                    label="Stroke Color"
                                    color={textObj.stroke || 'transparent'}
                                    onChange={(c) => handleUpdate({ stroke: c })}
                                    allowTransparent
                                />
                                <div className="space-y-2">
                                    <label className="text-xs text-[var(--stitch-text-secondary)]">Stroke Width</label>
                                    <StitchSlider
                                        min={0} max={10} step={0.5}
                                        value={textObj.strokeWidth || 0}
                                        onChange={(v) => handleUpdate({ strokeWidth: v })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Drop Shadow</h4>
                                <StitchColorPicker
                                    label="Shadow Color"
                                    color={shadowColor || '#000000'}
                                    onChange={(c) => handleUpdate({ shadow: new fabric.Shadow({ color: c, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY }) })}
                                    allowTransparent
                                />
                                <StitchSlider
                                    label="Blur" min={0} max={50} value={shadowBlur || 0}
                                    onChange={(v) => handleUpdate({ shadow: new fabric.Shadow({ color: shadowColor, blur: v, offsetX: shadowOffsetX, offsetY: shadowOffsetY }) })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <StitchSlider
                                        label="Offset X" min={-50} max={50} value={shadowOffsetX || 0}
                                        onChange={(v) => handleUpdate({ shadow: new fabric.Shadow({ color: shadowColor, blur: shadowBlur, offsetX: v, offsetY: shadowOffsetY }) })}
                                    />
                                    <StitchSlider
                                        label="Offset Y" min={-50} max={50} value={shadowOffsetY || 0}
                                        onChange={(v) => handleUpdate({ shadow: new fabric.Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: v }) })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </StitchModal>
    );
};
