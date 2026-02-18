import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useTemplateStore, TextStyle } from '../../store/templateStore';
import { StitchModal } from '../common/StitchModal';
import { StitchButton } from '../common/StitchButton';
import { StitchInput } from '../common/StitchInput';
import { useCanvasStore } from '../../store/canvasStore';
import { fabric } from 'fabric';

export const TextStyleManagerModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { textStyles, addTextStyle, updateTextStyle, deleteTextStyle } = useTemplateStore();
    const { canvas } = useCanvasStore();

    const isOpen = activeModal === 'textStyleManager';

    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [editedStyle, setEditedStyle] = useState<TextStyle | null>(null);

    // Provide default selection
    useEffect(() => {
        if (isOpen && textStyles.length > 0 && !selectedStyleId) {
            setSelectedStyleId(textStyles[0].id);
            setEditedStyle(textStyles[0]);
        }
    }, [isOpen, textStyles, selectedStyleId]);

    // Update edited style when selection changes
    useEffect(() => {
        if (selectedStyleId) {
            const style = textStyles.find(s => s.id === selectedStyleId);
            if (style) setEditedStyle({ ...style }); // Clone
        }
    }, [selectedStyleId, textStyles]);

    const handleSave = () => {
        if (editedStyle && selectedStyleId) {
            updateTextStyle(selectedStyleId, editedStyle);
            // Maybe show toast
        }
    };

    const handleCreateNew = () => {
        const newStyle: TextStyle = {
            id: `style-${Date.now()}`,
            name: 'New Style',
            properties: {
                fontSize: 18,
                fontFamily: 'Arial',
                fill: '#000000',
                fontWeight: 'normal'
            }
        };
        addTextStyle(newStyle);
        setSelectedStyleId(newStyle.id);
        setEditedStyle(newStyle);
    };

    const handleApply = () => {
        if (!canvas || !editedStyle) return;
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'textbox')) {
            activeObj.set(editedStyle.properties);
            canvas.requestRenderAll();
            closeModal();
        }
    };

    const handlePropertyChange = (key: string, value: any) => {
        if (editedStyle) {
            setEditedStyle({
                ...editedStyle,
                properties: {
                    ...editedStyle.properties,
                    [key]: value
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <StitchModal
            isOpen={isOpen}
            onClose={() => closeModal()}
            title="Text Style Manager"
            size="lg" // Larger modal for 3 panels
        >
            <div className="flex h-[500px] border-t border-gray-700">
                {/* Left Panel: Style Library */}
                <div className="w-1/4 border-r border-gray-700 bg-gray-900 overflow-y-auto">
                    <div className="p-2">
                        <StitchButton variant="secondary" size="sm" className="w-full mb-2" onClick={handleCreateNew}>
                            + Create New Style
                        </StitchButton>
                        <div className="space-y-1">
                            {textStyles.map(style => (
                                <div
                                    key={style.id}
                                    onClick={() => setSelectedStyleId(style.id)}
                                    className={`p-2 rounded cursor-pointer text-sm flex justify-between items-center ${selectedStyleId === style.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                                        }`}
                                >
                                    <span>{style.name}</span>
                                    {/* Delete button (only show on hover or selected?) */}
                                    {selectedStyleId === style.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTextStyle(style.id); }}
                                            className="text-white opacity-50 hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Panel: Style Editor */}
                <div className="w-2/4 border-r border-gray-700 bg-gray-800 p-4 overflow-y-auto">
                    {editedStyle ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Properties</h3>

                            <StitchInput
                                label="Style Name"
                                value={editedStyle.name}
                                onChange={(e) => setEditedStyle({ ...editedStyle, name: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <StitchInput
                                    label="Font Family"
                                    value={editedStyle.properties.fontFamily || 'Arial'}
                                    onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                                />
                                <StitchInput
                                    label="Font Size"
                                    type="number"
                                    value={editedStyle.properties.fontSize || 16}
                                    onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Font Weight</label>
                                    <select
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        value={editedStyle.properties.fontWeight || 'normal'}
                                        onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                        <option value="light">Light</option>
                                    </select>
                                </div>
                                <StitchInput
                                    label="Color"
                                    type="color"
                                    value={editedStyle.properties.fill || '#000000'}
                                    onChange={(e) => handlePropertyChange('fill', e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex gap-2">
                                <StitchButton variant="primary" onClick={handleSave}>
                                    Save Changes
                                </StitchButton>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a style to edit
                        </div>
                    )}
                </div>

                {/* Right Panel: Preview */}
                <div className="w-1/4 bg-white p-4 flex flex-col items-center justify-center relative bg-checkerboard">
                    <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono uppercase">Preview</div>
                    {editedStyle && (
                        <div style={{
                            fontFamily: editedStyle.properties.fontFamily,
                            fontSize: `${editedStyle.properties.fontSize}px`,
                            fontWeight: editedStyle.properties.fontWeight,
                            color: editedStyle.properties.fill,
                            // Add other properties as needed
                        }}>
                            Sample Text
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-2">
                <StitchButton variant="secondary" onClick={() => closeModal()}>
                    Close
                </StitchButton>
                <StitchButton variant="primary" onClick={handleApply}>
                    Apply to Selection
                </StitchButton>
            </div>
        </StitchModal>
    );
};
