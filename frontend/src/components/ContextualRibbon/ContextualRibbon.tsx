import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { TextRibbon } from './TextRibbon';
import { ImageRibbon } from './ImageRibbon';
import { BackgroundRibbon } from './BackgroundRibbon';
import './ContextualRibbon.css';

export const ContextualRibbon: React.FC = () => {
    const { selectedObjects } = useSelectionStore();

    // Show BackgroundRibbon when no element is selected
    if (selectedObjects.length === 0) {
        return <BackgroundRibbon />;
    }

    const activeObject = selectedObjects[0];
    const type = (activeObject as any).elementType || activeObject.type;

    switch (type) {
        case 'text':
        case 'i-text':
        case 'textbox':
            return <TextRibbon />;
        case 'image':
            return <ImageRibbon />;
        default:
            return (
                <div className="contextual-ribbon default">
                    <div className="ribbon-info">
                        {selectedObjects.length > 1
                            ? `${selectedObjects.length} items selected`
                            : `${type || 'Element'} selected`}
                    </div>
                </div>
            );
    }
};
