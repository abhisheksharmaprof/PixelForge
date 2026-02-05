import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { ColorPicker } from '../Shared/ColorPicker';
import { FontPicker } from '../Shared/FontPicker';
import { Dropdown } from '../Shared/Dropdown';
import { Button } from '../Shared/Button';
import { Slider } from '../Shared/Slider';
import { fabric } from 'fabric';
import {
    FaBold,
    FaItalic,
    FaUnderline,
    FaStrikethrough,
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight,
    FaAlignJustify,
    FaPalette,
    FaHighlighter,
} from 'react-icons/fa';
import './TextRibbon.css';

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
    });

    useEffect(() => {
        if (selectedObjects.length === 1 && (selectedObjects[0].type === 'textbox' || selectedObjects[0].type === 'text')) {
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
            });
        }
    }, [selectedObjects]);

    const applyTextProperty = (property: string, value: any) => {
        if (!canvas || selectedObjects.length === 0) return;

        selectedObjects.forEach(obj => {
            if (obj.type === 'textbox' || obj.type === 'text') {
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
    const handleLetterSpacingChange = (spacing: number) => applyTextProperty('charSpacing', spacing * 10);

    const applyTextTransform = (transform: string) => {
        if (!canvas || selectedObjects.length === 0) return;
        selectedObjects.forEach(obj => {
            if (obj.type === 'textbox') {
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

    return (
        <div className="text-ribbon">
            {/* Font Family */}
            <div className="ribbon-group">
                <FontPicker
                    value={textProperties.fontFamily}
                    onChange={handleFontFamilyChange}
                />
            </div>

            <div className="ribbon-divider" />

            {/* Font Size */}
            <div className="ribbon-group">
                <Dropdown
                    value={textProperties.fontSize}
                    onChange={(value) => handleFontSizeChange(Number(value))}
                    options={[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map(size => ({ label: size.toString(), value: size }))}
                    width={60}
                />
                <Button size="small" onClick={() => handleFontSizeChange(Math.max(6, textProperties.fontSize - 2))}>T↓</Button>
                <Button size="small" onClick={() => handleFontSizeChange(Math.min(200, textProperties.fontSize + 2))}>T↑</Button>
            </div>

            <div className="ribbon-divider" />

            {/* Font Style */}
            <div className="ribbon-group">
                <Button size="small" variant={textProperties.fontWeight === 'bold' ? 'primary' : 'default'} onClick={toggleBold} title="Bold"><FaBold /></Button>
                <Button size="small" variant={textProperties.fontStyle === 'italic' ? 'primary' : 'default'} onClick={toggleItalic} title="Italic"><FaItalic /></Button>
                <Button size="small" variant={textProperties.underline ? 'primary' : 'default'} onClick={toggleUnderline} title="Underline"><FaUnderline /></Button>
                <Button size="small" variant={textProperties.linethrough ? 'primary' : 'default'} onClick={toggleLinethrough} title="Strikethrough"><FaStrikethrough /></Button>
            </div>

            <div className="ribbon-divider" />

            {/* Colors */}
            <div className="ribbon-group">
                <span className="group-label">Text Color</span>
                <ColorPicker color={textProperties.fill} onChange={handleTextColorChange} icon={<FaPalette />} />
                <ColorPicker color={textProperties.backgroundColor} onChange={handleBackgroundColorChange} icon={<FaHighlighter />} allowTransparent />
            </div>

            <div className="ribbon-divider" />

            {/* Alignment */}
            <div className="ribbon-group">
                <Button size="small" variant={textProperties.textAlign === 'left' ? 'primary' : 'default'} onClick={() => setTextAlign('left')}><FaAlignLeft /></Button>
                <Button size="small" variant={textProperties.textAlign === 'center' ? 'primary' : 'default'} onClick={() => setTextAlign('center')}><FaAlignCenter /></Button>
                <Button size="small" variant={textProperties.textAlign === 'right' ? 'primary' : 'default'} onClick={() => setTextAlign('right')}><FaAlignRight /></Button>
                <Button size="small" variant={textProperties.textAlign === 'justify' ? 'primary' : 'default'} onClick={() => setTextAlign('justify')}><FaAlignJustify /></Button>
            </div>

            <div className="ribbon-divider" />

            {/* Line Spacing */}
            <div className="ribbon-group">
                <span className="group-label">Line Spacing</span>
                <Dropdown
                    value={textProperties.lineHeight}
                    onChange={(value) => handleLineHeightChange(Number(value))}
                    options={[
                        { label: '1.0', value: 1.0 },
                        { label: '1.5', value: 1.5 },
                        { label: '2.0', value: 2.0 },
                    ]}
                    width={70}
                />
            </div>

            <div className="ribbon-divider" />

            {/* Letter Spacing */}
            <div className="ribbon-group letter-spacing-group">
                <span className="group-label">Letter Spacing</span>
                <Slider
                    min={-5}
                    max={10}
                    step={0.5}
                    value={textProperties.charSpacing / 10}
                    onChange={handleLetterSpacingChange}
                    width={100}
                />
            </div>

            <div className="ribbon-divider" />

            {/* Transform */}
            <div className="ribbon-group">
                <Button size="small" onClick={() => applyTextTransform('uppercase')} title="UPPERCASE">AA</Button>
                <Button size="small" onClick={() => applyTextTransform('lowercase')} title="lowercase">aa</Button>
                <Button size="small" onClick={() => applyTextTransform('capitalize')} title="Capitalize">Aa</Button>
            </div>
        </div>
    );
};
