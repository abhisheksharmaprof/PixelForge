import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { TextRibbon } from './TextRibbon';
import { ImageRibbon } from './ImageRibbon';
import { BackgroundRibbon } from './BackgroundRibbon';
import { MailMergeRibbon } from './MailMergeRibbon';
import { TableRibbon } from './TableRibbon';

export const ContextualRibbon: React.FC = () => {
    const { selectedObjects } = useSelectionStore();

    // Show BackgroundRibbon when no element is selected
    if (selectedObjects.length === 0) {
        return <BackgroundRibbon />;
    }

    const activeObject = selectedObjects[0];
    const type = (activeObject as any).elementType || activeObject.type;

    let content = null;

    switch (type) {
        case 'text':
        case 'i-text':
        case 'textbox':
            content = <TextRibbon />;
            break;
        case 'image':
            content = <ImageRibbon />;
            break;
        case 'mailmerge':
        case 'mailmerge-field':
        case 'mailmerge-image':
        case 'mailmerge-condition':
            content = <MailMergeRibbon />;
            break;
        case 'table':
            content = <TableRibbon />;
            break;
        default:
            content = (
                <div className="flex items-center text-sm text-[var(--stitch-text-secondary)] px-2">
                    {selectedObjects.length > 1
                        ? `${selectedObjects.length} items selected`
                        : `${type || 'Element'} selected`}
                </div>
            );
            break;
    }

    // Container is now handled by the parent layout in EditorScreen
    return (
        <div className="flex items-center h-full gap-2 w-full">
            {content}
        </div>
    );
};
