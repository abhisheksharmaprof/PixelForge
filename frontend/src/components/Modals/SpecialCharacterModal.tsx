import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { StitchModal } from '../common/StitchModal';
import { StitchButton } from '../common/StitchButton';
import { StitchInput } from '../common/StitchInput';
import { fabric } from 'fabric';

const CHARACTER_SETS = {
    'Math': ['×', '÷', '±', '≠', '≈', '∞', '∑', '∫', '√', 'π', '∆', 'µ', '∂'],
    'Currency': ['$', '€', '£', '¥', '¢', '₹', '₽', '₿', '₪', '₩'],
    'Punctuation': ['—', '–', '…', '“', '”', '‘', '’', '«', '»', '•', '©', '®', '™', '§', '¶', '†', '‡'],
    'Arrows': ['←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '▲', '▼', '►', '◄'],
    'Greek': ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'],
    'Emoji': ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '❤️', '✅', '❌', '⭐', '🔥', '💡', '⚠️']
};

export const SpecialCharacterModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { canvas } = useCanvasStore();
    const isOpen = activeModal === 'specialCharacter';

    const [activeCategory, setActiveCategory] = useState<keyof typeof CHARACTER_SETS>('Math');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const handleInsert = (char: string) => {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();

        if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'textbox' || activeObj.type === 'text')) {
            const textObj = activeObj as fabric.IText;

            // Insert at cursor position or append
            if (textObj.isEditing && textObj.selectionStart !== undefined) {
                textObj.insertChars(char);
            } else {
                const currentText = textObj.text || '';
                textObj.set('text', currentText + char);
            }
            canvas.requestRenderAll();
        } else {
            // Create new text object if nothing selected
            const text = new fabric.IText(char, {
                left: canvas.width ? canvas.width / 2 : 100,
                top: canvas.height ? canvas.height / 2 : 100,
                fontSize: 40,
                fontFamily: 'Arial',
            });
            canvas.add(text);
            canvas.setActiveObject(text);
            canvas.requestRenderAll();
        }
    };

    const categories = Object.keys(CHARACTER_SETS) as Array<keyof typeof CHARACTER_SETS>;

    // Filter characters if search query exists
    const getFilteredCharacters = () => {
        if (!searchQuery) return CHARACTER_SETS[activeCategory];

        // Search across all categories if query exists
        const allChars = Object.values(CHARACTER_SETS).flat();
        return allChars.filter(char => char.includes(searchQuery)); // Simple check, could be better with names
    };

    const displayChars = getFilteredCharacters();

    return (
        <StitchModal
            isOpen={isOpen}
            onClose={() => closeModal()}
            title="Insert Special Character"
            size="md"
        >
            <div className="flex flex-col h-[400px]">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-700">
                    <StitchInput
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Categories */}
                    {!searchQuery && (
                        <div className="w-32 border-r border-gray-700 bg-gray-900 p-2 overflow-y-auto">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm mb-1 ${activeCategory === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Character Grid */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-800">
                        <div className="grid grid-cols-8 gap-2">
                            {displayChars.map((char, i) => (
                                <button
                                    key={`${char}-${i}`}
                                    onClick={() => handleInsert(char)}
                                    className="aspect-square flex items-center justify-center text-xl bg-gray-700 hover:bg-blue-600 rounded transition-colors text-white border border-gray-600 hover:border-blue-500"
                                    title={`Insert ${char}`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                        {displayChars.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">No characters found</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-between items-center text-xs text-gray-400">
                    <span>Click to insert</span>
                    <StitchButton variant="ghost" size="sm" onClick={() => closeModal()}>
                        Close
                    </StitchButton>
                </div>
            </div>
        </StitchModal>
    );
};
