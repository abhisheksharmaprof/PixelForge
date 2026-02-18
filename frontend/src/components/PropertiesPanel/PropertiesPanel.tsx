import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { TextProperties } from './TextProperties';
import { ImageProperties } from './ImageProperties';
import { QRCodeBarcodeProperties } from './QRCodeBarcodeProperties';
import { BackgroundProperties } from './BackgroundProperties';
// CSS removed

export const PropertiesPanel: React.FC = () => {
    const { selectedObjects } = useSelectionStore();

    // When no element is selected, show background properties
    if (selectedObjects.length === 0) {
        return (
            <div className="h-full flex flex-col bg-[var(--stitch-surface)] text-[var(--stitch-text-primary)] border-l border-[var(--stitch-border)]">
                <BackgroundProperties />
            </div>
        );
    }

    const activeObject = selectedObjects[0];
    const type = (activeObject as any).elementType || activeObject.type;

    const renderContent = () => {
        switch (type) {
            case 'text':
            case 'i-text':
            case 'textbox':
                return <TextProperties />;
            case 'image':
                return <ImageProperties />;
            case 'qrcode':
            case 'barcode':
                return <QRCodeBarcodeProperties />;
            default:
                return (
                    <div className="flex items-center justify-center h-full p-8 text-[var(--stitch-text-tertiary)] italic text-sm">
                        No properties available for this element
                    </div>
                );
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--stitch-surface)] text-[var(--stitch-text-primary)] border-l border-[var(--stitch-border)] overflow-hidden">
            {renderContent()}
        </div>
    );
};
