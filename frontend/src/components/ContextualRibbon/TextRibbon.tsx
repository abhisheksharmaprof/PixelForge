import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUIStore } from '../../store/uiStore';
import { StitchColorPicker } from '../common/StitchColorPicker';
import { StitchButton } from '../common/StitchButton';
import { StitchSlider } from '../common/StitchSlider';
import { fabric } from 'fabric';
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    ChevronDown,
    List, ListOrdered
} from 'lucide-react';

export const TextRibbon: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();

    const [textProperties, setTextProperties] = useState({
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        fill: '#000000',
        backgroundColor: 'transparent',
        textAlign: 'left',
        lineHeight: 1.16,
        charSpacing: 0,
        underline: false,
        linethrough: false,
        listType: 'none',
    });

    useEffect(() => {
        if (selectedObjects.length === 1 && (selectedObjects[0].type === 'textbox' || selectedObjects[0].type === 'text' || selectedObjects[0].type === 'i-text')) {
            const textObj = selectedObjects[0] as fabric.Textbox;
            setTextProperties({
                fontFamily: textObj.fontFamily || 'Arial',
                fontSize: textObj.fontSize || 16,
                fontWeight: (textObj.fontWeight as string) || 'normal',
                fontStyle: textObj.fontStyle || 'normal',
                fill: (textObj.fill as string) || '#000000',
                backgroundColor: textObj.backgroundColor || 'transparent',
                textAlign: textObj.textAlign || 'left',
                lineHeight: textObj.lineHeight || 1.16,
                charSpacing: textObj.charSpacing || 0,
                underline: textObj.underline || false,
                linethrough: textObj.linethrough || false,
                listType: (textObj.data && textObj.data.listType) || 'none',
            });
        }
    }, [selectedObjects]);

    const applyTextProperty = (property: string, value: any) => {
        if (!canvas || selectedObjects.length === 0) return;

        selectedObjects.forEach(obj => {
            if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
                (obj as any).set({ [property]: value });
            }
        });

        canvas.renderAll();
        setTextProperties(prev => ({ ...prev, [property]: value }));
    };

    const handleFontFamilyChange = (fontFamily: string) => applyTextProperty('fontFamily', fontFamily);
    const handleFontSizeChange = (size: number) => applyTextProperty('fontSize', size);
    const toggleBold = () => applyTextProperty('fontWeight', textProperties.fontWeight === 'bold' ? 'normal' : 'bold');
    const toggleItalic = () => applyTextProperty('fontStyle', textProperties.fontStyle === 'italic' ? 'normal' : 'italic');
    const toggleUnderline = () => applyTextProperty('underline', !textProperties.underline);
    const toggleLinethrough = () => applyTextProperty('linethrough', !textProperties.linethrough);
    const handleTextColorChange = (color: string) => applyTextProperty('fill', color);
    const handleBackgroundColorChange = (color: string) => applyTextProperty('backgroundColor', color);
    const setTextAlign = (align: string) => applyTextProperty('textAlign', align);
    const handleLineHeightChange = (lineHeight: number) => applyTextProperty('lineHeight', lineHeight);
    const handleLetterSpacingChange = (spacing: number) => applyTextProperty('charSpacing', spacing);

    const applyTextTransform = (transform: string) => {
        if (!canvas || selectedObjects.length === 0) return;
        selectedObjects.forEach(obj => {
            if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
                const textbox = obj as fabric.Textbox;
                let transformedText = textbox.text || '';
                switch (transform) {
                    case 'uppercase': transformedText = transformedText.toUpperCase(); break;
                    case 'lowercase': transformedText = transformedText.toLowerCase(); break;
                    case 'capitalize': transformedText = transformedText.replace(/\b\w/g, l => l.toUpperCase()); break;
                }
                textbox.set({ text: transformedText });
            }
        });
        canvas.renderAll();
    };

    const handleListToggle = (type: 'bullet' | 'numbered') => {
        if (!canvas || selectedObjects.length === 0) return;

        const newType = textProperties.listType === type ? 'none' : type;

        selectedObjects.forEach(obj => {
            if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
                obj.set('data', { ...(obj.data || {}), listType: newType });
            }
        });

        setTextProperties(prev => ({ ...prev, listType: newType }));
        canvas.renderAll();
    };

    // Common fonts
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica', 'Roboto', 'Open Sans'];

    return (
        <div className="flex items-center gap-4 px-4 h-full w-full">
            {/* Font Family */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        className="appearance-none h-8 pl-3 pr-8 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:outline-none focus:border-[var(--stitch-primary)] min-w-[120px]"
                        value={textProperties.fontFamily}
                        onChange={(e) => handleFontFamilyChange(e.target.value)}
                    >
                        {fonts.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--stitch-text-tertiary)] pointer-events-none" />
                </div>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Font Size */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        className="appearance-none h-8 pl-3 pr-8 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:outline-none focus:border-[var(--stitch-primary)] w-16"
                        value={textProperties.fontSize}
                        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    >
                        {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--stitch-text-tertiary)] pointer-events-none" />
                </div>
                <div className="flex items-center border border-[var(--stitch-border)] rounded-md overflow-hidden">
                    <button
                        className="h-8 w-8 flex items-center justify-center bg-[var(--stitch-background)] hover:bg-[var(--stitch-surface-hover)] text-[var(--stitch-text-primary)] text-xs border-r border-[var(--stitch-border)]"
                        onClick={() => handleFontSizeChange(Math.max(6, textProperties.fontSize - 2))}
                    >
                        A-
                    </button>
                    <button
                        className="h-8 w-8 flex items-center justify-center bg-[var(--stitch-background)] hover:bg-[var(--stitch-surface-hover)] text-[var(--stitch-text-primary)] text-xs"
                        onClick={() => handleFontSizeChange(Math.min(200, textProperties.fontSize + 2))}
                    >
                        A+
                    </button>
                </div>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Font Style */}
            <div className="flex items-center gap-1">
                <StitchButton
                    size="sm"
                    variant={textProperties.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                    onClick={toggleBold}
                    title="Bold"
                >
                    <Bold size={14} />
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={textProperties.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                    onClick={toggleItalic}
                    title="Italic"
                >
                    <Italic size={14} />
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={textProperties.underline ? 'primary' : 'ghost'}
                    onClick={toggleUnderline}
                    title="Underline"
                >
                    <Underline size={14} />
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={textProperties.linethrough ? 'primary' : 'ghost'}
                    onClick={toggleLinethrough}
                    title="Strikethrough"
                >
                    <Strikethrough size={14} />
                </StitchButton>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Colors */}
            <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[var(--stitch-text-tertiary)] uppercase font-semibold">Color</span>
                    <div className="flex gap-2">
                        <StitchColorPicker color={textProperties.fill} onChange={handleTextColorChange} />
                        <StitchColorPicker color={textProperties.backgroundColor} onChange={handleBackgroundColorChange} allowTransparent />
                    </div>
                </div>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Alignment */}
            <div className="flex items-center gap-1 border border-[var(--stitch-border)] rounded-md p-0.5 bg-[var(--stitch-background)]">
                <button
                    className={`p-1.5 rounded transition-colors ${textProperties.textAlign === 'left' ? 'bg-[var(--stitch-surface-active)] text-[var(--stitch-primary)]' : 'text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-primary)]'}`}
                    onClick={() => setTextAlign('left')}
                >
                    <AlignLeft size={14} />
                </button>
                <button
                    className={`p-1.5 rounded transition-colors ${textProperties.textAlign === 'center' ? 'bg-[var(--stitch-surface-active)] text-[var(--stitch-primary)]' : 'text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-primary)]'}`}
                    onClick={() => setTextAlign('center')}
                >
                    <AlignCenter size={14} />
                </button>
                <button
                    className={`p-1.5 rounded transition-colors ${textProperties.textAlign === 'right' ? 'bg-[var(--stitch-surface-active)] text-[var(--stitch-primary)]' : 'text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-primary)]'}`}
                    onClick={() => setTextAlign('right')}
                >
                    <AlignRight size={14} />
                </button>
                <button
                    className={`p-1.5 rounded transition-colors ${textProperties.textAlign === 'justify' ? 'bg-[var(--stitch-surface-active)] text-[var(--stitch-primary)]' : 'text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-primary)]'}`}
                    onClick={() => setTextAlign('justify')}
                >
                    <AlignJustify size={14} />
                </button>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Lists */}
            <div className="flex items-center gap-1">
                <StitchButton
                    size="sm"
                    variant={textProperties.listType === 'bullet' ? 'secondary' : 'ghost'}
                    onClick={() => handleListToggle('bullet')}
                    title="Bulleted List"
                >
                    <List size={14} />
                </StitchButton>
                <StitchButton
                    size="sm"
                    variant={textProperties.listType === 'numbered' ? 'secondary' : 'ghost'}
                    onClick={() => handleListToggle('numbered')}
                    title="Numbered List"
                >
                    <ListOrdered size={14} />
                </StitchButton>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Effects */}
            <StitchButton
                size="sm"
                variant="ghost"
                onClick={() => useUIStore.getState().openModal('advancedTextProperties')}
                className="text-xs font-medium px-2"
            >
                Effects
            </StitchButton>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Line Height & Spacing */}
            <div className="flex items-center gap-4">
                <div className="relative w-20">
                    <label className="text-[10px] text-[var(--stitch-text-tertiary)] absolute -top-2 left-0">Line Height</label>
                    <select
                        className="w-full appearance-none h-6 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none border-b border-[var(--stitch-border)]"
                        value={textProperties.lineHeight}
                        onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                    >
                        <option value={1.0}>1.0</option>
                        <option value={1.16}>1.16</option>
                        <option value={1.5}>1.5</option>
                        <option value={2.0}>2.0</option>
                    </select>
                </div>
                <div className="w-24">
                    {/* Letter Spacing */}
                    <StitchSlider
                        label="Spacing"
                        min={-50}
                        max={200}
                        step={1}
                        value={textProperties.charSpacing}
                        onChange={(v) => handleLetterSpacingChange(v)}
                    />
                </div>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Transform */}
            <div className="flex items-center gap-1">
                <StitchButton size="sm" variant="ghost" onClick={() => applyTextTransform('uppercase')}>AA</StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={() => applyTextTransform('lowercase')}>aa</StitchButton>
                <StitchButton size="sm" variant="ghost" onClick={() => applyTextTransform('capitalize')}>Aa</StitchButton>
            </div>

        </div>
    );
};
