import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { TextProperties } from './TextProperties';
import { ImageProperties } from './ImageProperties';
import { QRCodeBarcodeProperties } from './QRCodeBarcodeProperties';
import { BackgroundProperties } from './BackgroundProperties';
import { MailMergeProperties } from './MailMergeProperties';
import { TableProperties } from './TableProperties';
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
    console.log('[DEBUG PropertiesPanel] selectedObjects.length:', selectedObjects.length, 'type:', type, 'obj.type:', activeObject.type, 'obj.elementType:', (activeObject as any).elementType, 'constructor:', activeObject.constructor?.name);

    const renderContent = () => {
        const panels: React.ReactNode[] = [];

        // 1. Check for Mail Merge / Data Binding Properties
        if (
            type === 'mailmerge' ||
            type === 'mailmerge-field' ||
            type === 'mailmerge-image' ||
            type === 'mailmerge-image-placeholder' ||
            type === 'mailmerge-condition'
        ) {
            panels.push(<MailMergeProperties key="mailmerge-props" />);
        }

        // 2. Add Base Properties based on underlying type
        switch (type) {
            case 'text':
            case 'i-text':
            case 'textbox':
            case 'mailmerge-field':
                panels.push(<TextProperties key="text-props" />);
                break;
            case 'image':
            case 'mailmerge-image':
            case 'mailmerge-image-placeholder':
                panels.push(<ImageProperties key="image-props" />);
                break;
            case 'qrcode':
            case 'barcode':
                panels.push(<QRCodeBarcodeProperties key="qr-props" />);
                break;
            case 'table':
                panels.push(<TableProperties key="table-props" />);
                break;
            default:
                if (panels.length === 0) {
                    return (
                        <div className="flex items-center justify-center h-full p-8 text-[var(--stitch-text-tertiary)] italic text-sm">
                            No properties available for this element
                        </div>
                    );
                }
        }

        return (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar divide-y divide-[var(--stitch-border)]">
                {panels}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-[var(--stitch-surface)] text-[var(--stitch-text-primary)] border-l border-[var(--stitch-border)] overflow-hidden">
            {renderContent()}
        </div>
    );
};
