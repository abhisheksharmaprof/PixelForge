import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { StitchModal } from '../common/StitchModal';
import { StitchButton } from '../common/StitchButton';
import { StitchInput } from '../common/StitchInput';
import { fabric } from 'fabric';

export const FindReplaceModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { canvas } = useCanvasStore();
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [matchCase, setMatchCase] = useState(false);
    const [matchWholeWord, setMatchWholeWord] = useState(false);
    const [resultsCount, setResultsCount] = useState<number | null>(null);

    const isOpen = activeModal === 'findReplace';

    const handleFind = () => {
        if (!canvas || !findText) return;

        const objects = canvas.getObjects();
        let count = 0;

        objects.forEach(obj => {
            if (obj.type === 'text' || obj.type === 'textbox' || obj.type === 'i-text') {
                const textObj = obj as fabric.IText;
                if (textObj.text) {
                    let text = textObj.text;
                    let search = findText;

                    if (!matchCase) {
                        text = text.toLowerCase();
                        search = search.toLowerCase();
                    }

                    if (matchWholeWord) {
                        const regex = new RegExp(`\\b${search}\\b`, matchCase ? 'g' : 'gi');
                        if (regex.test(textObj.text)) count++;
                    } else {
                        if (text.includes(search)) count++;
                    }
                }
            }
        });

        setResultsCount(count);
        // Select first match?
        // simple implementation for now
    };

    const handleReplaceAll = () => {
        if (!canvas || !findText) return;

        let count = 0;
        const objects = canvas.getObjects();
        objects.forEach(obj => {
            if (obj.type === 'text' || obj.type === 'textbox' || obj.type === 'i-text') {
                const textObj = obj as fabric.IText;
                const originalText = textObj.text || '';

                let regexFlags = 'g';
                if (!matchCase) regexFlags += 'i';

                // Escape regex special chars in findText if not using regex mode (we are using literal string search logic wrapped in regex for global replace)
                // For simplicity assuming literal string replacement
                const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = matchWholeWord ? `\\b${escapedFind}\\b` : escapedFind;
                const regex = new RegExp(pattern, regexFlags);

                if (regex.test(originalText)) {
                    const newText = originalText.replace(regex, replaceText);
                    textObj.set('text', newText);
                    count++;
                }
            }
        });

        if (count > 0) {
            canvas.renderAll();
            setResultsCount(count);
            // Maybe show specific success message
        }
    };

    const handleReplaceNext = () => {
        // Find next occurrence and replace
        // Requires tracking current index or selection
        // For MVP, Replace All is key.
        handleReplaceAll();
    };

    return (
        <StitchModal
            isOpen={isOpen}
            onClose={closeModal}
            title="Find and Replace"
            size="sm"
        >
            <div className="space-y-4 p-1">
                <StitchInput
                    label="Find"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder="Text to find..."
                    autoFocus
                />

                <StitchInput
                    label="Replace with"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Replacement text..."
                />

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-[var(--stitch-text-secondary)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={matchCase}
                            onChange={(e) => setMatchCase(e.target.checked)}
                            className="rounded border-[var(--stitch-border-primary)]"
                        />
                        Match Case
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--stitch-text-secondary)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={matchWholeWord}
                            onChange={(e) => setMatchWholeWord(e.target.checked)}
                            className="rounded border-[var(--stitch-border-primary)]"
                        />
                        Match Whole Word
                    </label>
                </div>

                {resultsCount !== null && (
                    <div className="text-sm text-[var(--stitch-accent-primary)]">
                        {resultsCount} matches found/replaced.
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <StitchButton variant="secondary" onClick={closeModal}>
                        Close
                    </StitchButton>
                    <StitchButton variant="secondary" onClick={handleFind}>
                        Find All
                    </StitchButton>
                    <StitchButton variant="primary" onClick={handleReplaceAll}>
                        Replace All
                    </StitchButton>
                </div>
            </div>
        </StitchModal>
    );
};
