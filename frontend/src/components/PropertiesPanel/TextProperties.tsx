import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { StitchColorPicker } from '../common/StitchColorPicker';
import { StitchSlider } from '../common/StitchSlider';
import { StitchAccordion } from '../common/StitchAccordion';
import { StitchInput } from '../common/StitchInput';
import { fabric } from 'fabric';
import {
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type, List, ListOrdered, Lock, Unlock, Eye, EyeOff, Link,
    Bold, Italic, Underline, Strikethrough, Move, Layers, Search
} from 'lucide-react';
import clsx from 'clsx';

export const TextProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();

    // Get current text object
    const textObj = selectedObjects.length > 0 &&
        (selectedObjects[0].type === 'textbox' ||
            selectedObjects[0].type === 'text' ||
            selectedObjects[0].type === 'i-text' ||
            (selectedObjects[0] as any).elementType === 'mailmerge-field')
        ? selectedObjects[0] as fabric.Textbox
        : null;

    // Force component re-render when canvas renders
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        if (!canvas) return;
        const handleCanvasRender = () => setUpdateTrigger(prev => prev + 1);
        canvas.on('after:render', handleCanvasRender);
        return () => { canvas.off('after:render', handleCanvasRender); };
    }, [canvas]);

    const updateProperty = (property: string, value: any) => {
        if (!canvas || selectedObjects.length === 0) return;

        selectedObjects.forEach((obj: any) => {
            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text' || obj.elementType === 'mailmerge-field') {
                obj.set({ [property]: value });
            }
        });

        canvas.renderAll();
        setUpdateTrigger(prev => prev + 1);
    };

    const updateDataProperty = (key: string, value: any) => {
        if (!canvas || selectedObjects.length === 0) return;

        selectedObjects.forEach((obj: any) => {
            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text' || obj.elementType === 'mailmerge-field') {
                obj.set('data', { ...(obj.data || {}), [key]: value });
            }
        });

        canvas.renderAll();
        setUpdateTrigger(prev => prev + 1);
    };

    if (!textObj) {
        return <div className="h-full flex items-center justify-center text-[var(--stitch-text-tertiary)] text-sm">Select a text element</div>;
    }

    // derived values
    const fontSize = textObj.fontSize || 16;
    const fontFamily = textObj.fontFamily || 'Inter';
    const fontWeight = String(textObj.fontWeight || 'normal');
    const fontStyle = textObj.fontStyle || 'normal';
    const lineHeight = textObj.lineHeight || 1.16;
    const charSpacing = textObj.charSpacing || 0;
    const textContent = textObj.text || '';
    const textColor = (textObj.fill as string) || '#000000';
    const backgroundColor = textObj.backgroundColor || 'transparent';
    const textAlign = textObj.textAlign || 'left';
    const listType = (textObj.data && textObj.data.listType) || 'none';
    const shadow = textObj.shadow as fabric.Shadow;
    const shadowColor = (shadow ? shadow.color : 'transparent') || 'transparent';
    const shadowBlur = (shadow ? shadow.blur : 0) || 0;
    const shadowOffsetX = (shadow ? shadow.offsetX : 0) || 0;
    const shadowOffsetY = (shadow ? shadow.offsetY : 0) || 0;

    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Inter', 'Roboto', 'Poppins', 'Open Sans', 'Montserrat'];

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-[var(--stitch-surface-primary)]">

            {/* 1. Content */}
            <StitchAccordion title="Content" defaultOpen icon={<Type size={16} />}>
                <div className="space-y-2">
                    <textarea
                        value={textContent}
                        onChange={(e) => updateProperty('text', e.target.value)}
                        rows={4}
                        className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:border-[var(--stitch-primary)] focus:outline-none transition-colors duration-200 resize-y min-h-[80px]"
                    />
                    <div className="text-xs text-[var(--stitch-text-tertiary)] text-right">
                        {textContent.length} chars
                    </div>
                </div>
            </StitchAccordion>

            {/* 2. Typography */}
            <StitchAccordion title="Typography" defaultOpen>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs text-[var(--stitch-text-secondary)]">Font Family</label>
                        <select
                            value={fontFamily}
                            onChange={(e) => updateProperty('fontFamily', e.target.value)}
                            className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)]"
                        >
                            {fonts.map(font => (
                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-[var(--stitch-text-secondary)]">Size</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm"
                                value={fontSize}
                                onChange={(e) => updateProperty('fontSize', Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-[var(--stitch-text-secondary)]">Weight</label>
                            <select
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm"
                                value={fontWeight}
                                onChange={(e) => updateProperty('fontWeight', e.target.value)}
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                                <option value="100">Thin</option>
                                <option value="300">Light</option>
                                <option value="500">Medium</option>
                                <option value="700">Bold</option>
                                <option value="900">Black</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1 pt-2">
                        <label className="text-xs text-[var(--stitch-text-secondary)]">Text Transform</label>
                        <select
                            className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm"
                            value={(textObj.data && textObj.data.textTransform) || 'none'}
                            onChange={(e) => {
                                const type = e.target.value;

                                if (!canvas || selectedObjects.length === 0) return;

                                selectedObjects.forEach((obj: any) => {
                                    if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text' || obj.elementType === 'mailmerge-field') {
                                        // key fix: use the object's OWN original text, not the primary selection's
                                        const originalText = (obj.data && obj.data.originalText) || obj.text;

                                        let newText = originalText;
                                        if (type === 'uppercase') newText = originalText.toUpperCase();
                                        if (type === 'lowercase') newText = originalText.toLowerCase();
                                        if (type === 'capitalize') newText = originalText.replace(/\b\w/g, (l: string) => l.toUpperCase());

                                        obj.set('text', newText);
                                        obj.set('data', { ...(obj.data || {}), textTransform: type });

                                        // Store original text if not already stored
                                        if (!obj.data?.originalText) {
                                            obj.set('data', { ...(obj.data || {}), originalText: originalText });
                                        }
                                    }
                                });

                                canvas.renderAll();
                                setUpdateTrigger(prev => prev + 1);
                            }}
                        >
                            <option value="none">None</option>
                            <option value="uppercase">UPPERCASE</option>
                            <option value="lowercase">lowercase</option>
                            <option value="capitalize">Capitalize Each Word</option>
                        </select>
                    </div>

                    <div className="flex gap-1 justify-between pt-1">
                        <button onClick={() => updateProperty('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2 rounded ${fontStyle === 'italic' ? 'bg-[var(--stitch-surface-active)]' : ''}`}><Italic size={16} /></button>
                        <button onClick={() => updateProperty('underline', !textObj.underline)} className={`p-2 rounded ${textObj.underline ? 'bg-[var(--stitch-surface-active)]' : ''}`}><Underline size={16} /></button>
                        <button onClick={() => updateProperty('linethrough', !textObj.linethrough)} className={`p-2 rounded ${textObj.linethrough ? 'bg-[var(--stitch-surface-active)]' : ''}`}><Strikethrough size={16} /></button>
                        <button onClick={() => {
                            // Toggle Superscript
                            const isSuper = textObj.superscript; // Fabric native property check
                            // For full sup implementation we might need setSuperscript() if available on instance, 
                            // but standard fabric object property is 'superscript'. 
                            // Fabric.js standard doesn't have a simple boolean 'superscript' property on IText, 
                            // it uses setSubscript/setSuperscript for selections. 
                            // For simplicity/MVP we'll simulate or use data attr, but standard fabric IText supports styles.
                            // Let's rely on data attribute for state and applying deltaY/fontSize if possible, 
                            // OR just check if the user meant 'Superscript' icon for now.
                            // Actually, generic Fabric Textbox doesn't have simple sup/sub boolean without using styles.
                            // We will implement a simplified version or skip if too complex for single property update.
                            // Let's skip sup/sub for now as it requires character-level style manipulation which is complex in this component.
                            // Reverting to just adding Transform for now in this block.
                        }} className="hidden"><span className="text-xs">sup</span></button>
                        <button onClick={() => updateProperty('overline', !textObj.overline)} className={`p-2 rounded ${textObj.overline ? 'bg-[var(--stitch-surface-active)]' : ''}`}><span className="overline text-xs">Over</span></button>
                    </div>
                </div>
            </StitchAccordion>

            {/* 3. Alignment & Position */}
            <StitchAccordion title="Alignment & Position">
                <div className="space-y-4">
                    {/* H Alignment */}
                    <div className="flex bg-[var(--stitch-background)] rounded-lg p-1 border border-[var(--stitch-border)]">
                        {[
                            { align: 'left', Icon: AlignLeft },
                            { align: 'center', Icon: AlignCenter },
                            { align: 'right', Icon: AlignRight },
                            { align: 'justify', Icon: AlignJustify }
                        ].map(({ align, Icon }) => (
                            <button
                                key={align}
                                onClick={() => updateProperty('textAlign', align)}
                                className={`flex-1 p-1.5 rounded flex justify-center ${textAlign === align ? 'bg-[var(--stitch-primary)] text-white' : 'text-[var(--stitch-text-secondary)]'}`}
                            >
                                <Icon size={16} />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--stitch-text-secondary)] w-16">Direction</span>
                        <div className="flex gap-1 flex-1">
                            <button
                                onClick={() => updateProperty('direction', 'ltr')}
                                className={`flex-1 py-1 text-xs rounded border ${(!textObj.direction || textObj.direction === 'ltr') ? 'bg-[var(--stitch-primary-light)] border-[var(--stitch-primary)]' : 'bg-[var(--stitch-background)] border-[var(--stitch-border)]'}`}
                            >
                                LTR
                            </button>
                            <button
                                onClick={() => updateProperty('direction', 'rtl')}
                                className={`flex-1 py-1 text-xs rounded border ${textObj.direction === 'rtl' ? 'bg-[var(--stitch-primary-light)] border-[var(--stitch-primary)]' : 'bg-[var(--stitch-background)] border-[var(--stitch-border)]'}`}
                            >
                                RTL
                            </button>
                        </div>
                    </div>

                    {/* Dimensions & Position */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--stitch-border)]">
                        <div className="space-y-1">
                            <label className="text-xs text-[var(--stitch-text-secondary)]">X Pos</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm"
                                value={Math.round(textObj.left || 0)}
                                onChange={(e) => updateProperty('left', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-[var(--stitch-text-secondary)]">Y Pos</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm"
                                value={Math.round(textObj.top || 0)}
                                onChange={(e) => updateProperty('top', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-[var(--stitch-text-secondary)]">Width</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm"
                                value={Math.round(textObj.width || 0)}
                                onChange={(e) => updateProperty('width', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-[var(--stitch-text-secondary)]">Height</label>
                            <input
                                type="number"
                                className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm opacity-50 cursor-not-allowed"
                                value={Math.round(textObj.height || 0)}
                                disabled // Fabric calculates height
                            />
                        </div>
                    </div>

                    <StitchSlider label="Line Height" min={0.5} max={3} step={0.1} value={lineHeight} onChange={(v) => updateProperty('lineHeight', v)} />
                    <StitchSlider label="Letter Spacing" min={-50} max={200} step={1} value={charSpacing} onChange={(v) => updateProperty('charSpacing', v)} />
                </div>
            </StitchAccordion>

            {/* 4. Color & Effects */}
            <StitchAccordion title="Color & Effects">
                <div className="space-y-4">
                    <StitchColorPicker label="Text Color" color={textColor} onChange={(c) => updateProperty('fill', c)} />
                    <StitchSlider label="Opacity" min={0} max={1} step={0.01} value={textObj.opacity || 1} onChange={(v) => updateProperty('opacity', v)} />
                    <StitchColorPicker label="Background" color={backgroundColor} onChange={(c) => updateProperty('backgroundColor', c)} allowTransparent />

                    <div className="pt-2 border-t border-[var(--stitch-border)]">
                        <label className="text-xs font-medium mb-2 block">Stroke (Outline)</label>
                        <StitchColorPicker
                            label="Color"
                            color={textObj.stroke || 'transparent'}
                            onChange={(c) => updateProperty('stroke', c)}
                            allowTransparent
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <StitchSlider
                                label="Width"
                                min={0}
                                max={10}
                                step={0.1}
                                value={textObj.strokeWidth || 0}
                                onChange={(v) => updateProperty('strokeWidth', v)}
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--stitch-border)]">
                        <label className="text-xs font-medium mb-2 block">Shadow</label>
                        <StitchColorPicker label="Color" color={shadowColor} onChange={(c) => {
                            const newShadow = new fabric.Shadow({ color: c, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY });
                            updateProperty('shadow', newShadow);
                        }} allowTransparent />
                        <StitchSlider label="Blur" min={0} max={50} value={shadowBlur} onChange={(v) => {
                            const newShadow = new fabric.Shadow({ color: shadowColor, blur: v, offsetX: shadowOffsetX, offsetY: shadowOffsetY });
                            updateProperty('shadow', newShadow);
                        }} />
                        <StitchSlider label="Offset X" min={-20} max={20} value={shadowOffsetX} onChange={(v) => {
                            const newShadow = new fabric.Shadow({ color: shadowColor, blur: shadowBlur, offsetX: v, offsetY: shadowOffsetY });
                            updateProperty('shadow', newShadow);
                        }} />
                        <StitchSlider label="Offset Y" min={-20} max={20} value={shadowOffsetY} onChange={(v) => {
                            const newShadow = new fabric.Shadow({ color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: v });
                            updateProperty('shadow', newShadow);
                        }} />
                    </div>
                </div>
            </StitchAccordion>

            {/* 5. Lists */}
            <StitchAccordion title="Lists">
                <div className="flex gap-2">
                    <button
                        onClick={() => updateDataProperty('listType', listType === 'bullet' ? 'none' : 'bullet')}
                        className={`flex-1 flex gap-2 items-center justify-center p-2 rounded border ${listType === 'bullet' ? 'bg-[var(--stitch-primary-light)] border-[var(--stitch-primary)]' : 'bg-[var(--stitch-background)] border-[var(--stitch-border)]'}`}
                    >
                        <List size={16} /> Bullet
                    </button>
                    <button
                        onClick={() => updateDataProperty('listType', listType === 'numbered' ? 'none' : 'numbered')}
                        className={`flex-1 flex gap-2 items-center justify-center p-2 rounded border ${listType === 'numbered' ? 'bg-[var(--stitch-primary-light)] border-[var(--stitch-primary)]' : 'bg-[var(--stitch-background)] border-[var(--stitch-border)]'}`}
                    >
                        <ListOrdered size={16} /> Numbered
                    </button>
                </div>
            </StitchAccordion>

            {/* 6. Behavior */}
            <StitchAccordion title="Behavior" icon={<Layers size={16} />}>
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[var(--stitch-background)] rounded border border-[var(--stitch-border)]">
                        <span className="text-sm">Lock Movement</span>
                        <button onClick={() => {
                            if (!canvas) return;
                            const val = !textObj.lockMovementX;
                            textObj.set({ lockMovementX: val, lockMovementY: val, lockRotation: val, lockScalingX: val, lockScalingY: val });
                            canvas.renderAll();
                            setUpdateTrigger(prev => prev + 1);
                        }}>
                            {textObj.lockMovementX ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} className="text-gray-400" />}
                        </button>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[var(--stitch-background)] rounded border border-[var(--stitch-border)]">
                        <span className="text-sm">Visibility</span>
                        <button onClick={() => updateProperty('visible', !textObj.visible)}>
                            {textObj.visible ? <Eye size={16} className="text-gray-600" /> : <EyeOff size={16} className="text-gray-400" />}
                        </button>
                    </div>
                </div>
            </StitchAccordion>

            {/* 7. Interactivity */}
            <StitchAccordion title="Interactivity" icon={<Link size={16} />}>
                <StitchInput
                    label="Hyperlink URL"
                    placeholder="https://example.com"
                    value={(textObj.data && textObj.data.url) || ''}
                    onChange={(e) => updateDataProperty('url', e.target.value)}
                />
            </StitchAccordion>

            {/* 8. Accessibility */}
            <StitchAccordion title="Accessibility">
                <StitchInput
                    label="Aria Label"
                    placeholder="Description for screen readers"
                    value={(textObj.data && textObj.data.ariaLabel) || ''}
                    onChange={(e) => updateDataProperty('ariaLabel', e.target.value)}
                />
            </StitchAccordion>

        </div>
    );
};
