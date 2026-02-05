import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { ColorPicker } from '../Shared/ColorPicker';
import { FontPicker } from '../Shared/FontPicker';
import { Slider } from '../Shared/Slider';
import { Accordion } from '../Shared/Accordion';
import { fabric } from 'fabric';
import './TextProperties.css';

export const TextProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();

    // Get current text object
    const textObj = selectedObjects.length > 0 && selectedObjects[0].type === 'textbox'
        ? selectedObjects[0] as fabric.Textbox
        : null;

    // Read directly from textObj for display values
    const fontSize = textObj?.fontSize || 16;
    const fontFamily = textObj?.fontFamily || 'Arial';
    const fontWeight = String(textObj?.fontWeight || 'normal');
    const fontStyle = textObj?.fontStyle || 'normal';
    const lineHeight = textObj?.lineHeight || 1.16;
    const charSpacing = textObj?.charSpacing || 0;
    const textContent = textObj?.text || '';
    const textColor = (textObj?.fill as string) || '#000000';
    const textAlign = textObj?.textAlign || 'left';

    // Force component re-render when canvas renders
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        if (!canvas) return;

        const handleCanvasRender = () => {
            setUpdateTrigger(prev => prev + 1);
        };

        canvas.on('after:render', handleCanvasRender);

        return () => {
            canvas.off('after:render', handleCanvasRender);
        };
    }, [canvas]);

    // Update property helper
    const updateProperty = (property: string, value: any) => {
        if (!canvas || !textObj) return;

        textObj.set({ [property]: value });
        canvas.renderAll();
    };

    if (!textObj) {
        return <div className="text-properties empty-state">Select a text element</div>;
    }

    return (
        <div className="text-properties properties-panel-content">
            {/* Text Content */}
            <Accordion title="Text Content" defaultOpen>
                <div className="property-group">
                    <label>Text</label>
                    <textarea
                        value={textContent}
                        onChange={(e) => updateProperty('text', e.target.value)}
                        rows={4}
                        className="text-content-input"
                    />
                    <div className="text-info">
                        Characters: {textContent.length}
                    </div>
                </div>
            </Accordion>

            {/* Font Settings */}
            <Accordion title="Font" defaultOpen>
                <div className="property-group">
                    <label>Font Family</label>
                    <FontPicker
                        value={fontFamily}
                        onChange={(font) => updateProperty('fontFamily', font)}
                    />
                </div>

                <div className="property-group">
                    <label>Font Size</label>
                    <div className="font-size-row">
                        <div className="font-size-input-wrapper">
                            <input
                                type="number"
                                className="font-size-input"
                                value={fontSize}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val >= 1 && val <= 400) {
                                        updateProperty('fontSize', val);
                                    }
                                }}
                                onBlur={(e) => {
                                    let val = Number(e.target.value);
                                    if (val < 6) val = 6;
                                    if (val > 400) val = 400;
                                    updateProperty('fontSize', val);
                                }}
                            />
                            <span className="font-size-unit">pt</span>
                        </div>
                        <Slider
                            min={6}
                            max={100}
                            value={fontSize}
                            onChange={(value) => updateProperty('fontSize', value)}
                            showValue={false}
                        />
                    </div>
                </div>

                <div className="property-group">
                    <label>Font Weight</label>
                    <select
                        className="property-select"
                        value={fontWeight}
                        onChange={(e) => updateProperty('fontWeight', e.target.value)}
                    >
                        <option value="100">100 - Thin</option>
                        <option value="200">200 - Extra Light</option>
                        <option value="300">300 - Light</option>
                        <option value="normal">400 - Normal</option>
                        <option value="500">500 - Medium</option>
                        <option value="600">600 - Semi Bold</option>
                        <option value="bold">700 - Bold</option>
                        <option value="800">800 - Extra Bold</option>
                        <option value="900">900 - Black</option>
                    </select>
                </div>

                <div className="property-group">
                    <label>Font Style</label>
                    <select
                        className="property-select"
                        value={fontStyle}
                        onChange={(e) => updateProperty('fontStyle', e.target.value)}
                    >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                        <option value="oblique">Oblique</option>
                    </select>
                </div>
            </Accordion>

            {/* Text Style */}
            <Accordion title="Text Style">
                <div className="property-group">
                    <label>Text Color</label>
                    <ColorPicker
                        color={textColor}
                        onChange={(color) => updateProperty('fill', color)}
                    />
                </div>

                <div className="property-group">
                    <label>Background Color</label>
                    <ColorPicker
                        color={textObj.backgroundColor || 'transparent'}
                        onChange={(color) => updateProperty('backgroundColor', color)}
                        allowTransparent
                    />
                </div>

                <div className="property-group">
                    <label>Text Decoration</label>
                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={textObj.underline || false}
                                onChange={(e) => updateProperty('underline', e.target.checked)}
                            />
                            Underline
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={textObj.linethrough || false}
                                onChange={(e) => updateProperty('linethrough', e.target.checked)}
                            />
                            Strikethrough
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={textObj.overline || false}
                                onChange={(e) => updateProperty('overline', e.target.checked)}
                            />
                            Overline
                        </label>
                    </div>
                </div>
            </Accordion>

            {/* Paragraph Settings */}
            <Accordion title="Paragraph">
                <div className="property-group">
                    <label>Alignment</label>
                    <div className="alignment-buttons">
                        <button
                            className={textAlign === 'left' ? 'active' : ''}
                            onClick={() => updateProperty('textAlign', 'left')}
                        >Left</button>
                        <button
                            className={textAlign === 'center' ? 'active' : ''}
                            onClick={() => updateProperty('textAlign', 'center')}
                        >Center</button>
                        <button
                            className={textAlign === 'right' ? 'active' : ''}
                            onClick={() => updateProperty('textAlign', 'right')}
                        >Right</button>
                        <button
                            className={textAlign === 'justify' ? 'active' : ''}
                            onClick={() => updateProperty('textAlign', 'justify')}
                        >Justify</button>
                    </div>
                </div>

                <div className="property-group">
                    <label>Line Height</label>
                    <div className="slider-row">
                        <Slider
                            min={0.5}
                            max={3}
                            step={0.1}
                            value={lineHeight}
                            onChange={(value) => updateProperty('lineHeight', value)}
                        />
                    </div>
                </div>

                <div className="property-group">
                    <label>Letter Spacing</label>
                    <div className="slider-row">
                        <Slider
                            min={-50}
                            max={200}
                            step={1}
                            value={charSpacing}
                            onChange={(value) => updateProperty('charSpacing', value)}
                        />
                    </div>
                </div>
            </Accordion>
        </div>
    );
};
