import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../Shared/Input';
import { Dropdown } from '../Shared/Dropdown';
import { Accordion } from '../Shared/Accordion';
import { Button } from '../Shared/Button';
import './QRCodeBarcodeProperties.css';

export const QRCodeBarcodeProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { excelData } = useDataStore();

    if (selectedObjects.length === 0) {
        return <div>Select a QR code or barcode</div>;
    }

    const obj = selectedObjects[0] as any;
    const isQRCode = obj.elementType === 'qrcode';
    const isBarcode = obj.elementType === 'barcode';

    if (!isQRCode && !isBarcode) {
        return <div>Select a QR code or barcode</div>;
    }

    // Update property
    const updateProperty = (property: string, value: any) => {
        if (!canvas) return;
        obj[property] = value;
        canvas.renderAll();
    };

    return (
        <div className="qrcode-barcode-properties properties-panel-content">
            {/* Header */}
            <div className="property-header">
                <h3>{isQRCode ? 'QR Code' : 'Barcode'}</h3>
            </div>

            {/* Data settings */}
            <Accordion title="Data" defaultOpen>
                <div className="property-group">
                    <label>{isQRCode ? 'Data' : 'Value'}</label>
                    <Input
                        value={isQRCode ? obj.qrData : obj.barcodeData}
                        disabled
                    />
                </div>
            </Accordion>

            {/* Transform */}
            <Accordion title="Transform">
                <div className="property-group">
                    <label>Position</label>
                    <div className="two-column-input">
                        <Input
                            type="number"
                            label="X"
                            value={Math.round(obj.left || 0)}
                            onChange={(value) => {
                                obj.set({ left: Number(value) });
                                canvas?.renderAll();
                            }}
                            suffix="px"
                        />
                        <Input
                            type="number"
                            label="Y"
                            value={Math.round(obj.top || 0)}
                            onChange={(value) => {
                                obj.set({ top: Number(value) });
                                canvas?.renderAll();
                            }}
                            suffix="px"
                        />
                    </div>
                </div>
            </Accordion>
        </div>
    );
};
