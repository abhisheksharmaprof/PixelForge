import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDataStore } from '../../store/dataStore';
import { StitchAccordion } from '../common/StitchAccordion';
import { QrCode, Move, Database } from 'lucide-react';
// CSS removed

export const QRCodeBarcodeProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { excelData } = useDataStore();

    if (selectedObjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-[var(--stitch-text-tertiary)] gap-2">
                <QrCode size={32} strokeWidth={1.5} />
                <p className="text-sm">Select a code to edit</p>
            </div>
        );
    }

    const obj = selectedObjects[0] as any;
    const isQRCode = obj.elementType === 'qrcode';
    const isBarcode = obj.elementType === 'barcode';

    if (!isQRCode && !isBarcode) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-[var(--stitch-text-tertiary)] gap-2">
                <QrCode size={32} strokeWidth={1.5} />
                <p className="text-sm">Select a QR code or barcode</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--stitch-border)]">
                <h3 className="text-sm font-semibold text-[var(--stitch-text-primary)]">{isQRCode ? 'QR Code' : 'Barcode'}</h3>
            </div>

            {/* Data settings */}
            <StitchAccordion title="Data" icon={<Database size={16} />} defaultOpen>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">{isQRCode ? 'Data' : 'Value'}</label>
                    <input
                        type="text"
                        className="w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md text-sm text-[var(--stitch-text-primary)] focus:outline-none opacity-60 cursor-not-allowed"
                        value={isQRCode ? obj.qrData : obj.barcodeData}
                        disabled
                        title="Data is linked to source"
                    />
                </div>
            </StitchAccordion>

            {/* Transform */}
            <StitchAccordion title="Transform" icon={<Move size={16} />}>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Position</label>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md px-2">
                            <span className="text-xs text-[var(--stitch-text-tertiary)] mr-2">X</span>
                            <input
                                type="number"
                                className="w-full py-1.5 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none"
                                value={Math.round(obj.left || 0)}
                                onChange={(e) => {
                                    obj.set({ left: Number(e.target.value) });
                                    canvas?.renderAll();
                                }}
                            />
                        </div>
                        <div className="flex-1 flex items-center bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-md px-2">
                            <span className="text-xs text-[var(--stitch-text-tertiary)] mr-2">Y</span>
                            <input
                                type="number"
                                className="w-full py-1.5 bg-transparent text-sm text-[var(--stitch-text-primary)] focus:outline-none"
                                value={Math.round(obj.top || 0)}
                                onChange={(e) => {
                                    obj.set({ top: Number(e.target.value) });
                                    canvas?.renderAll();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </StitchAccordion>
        </div>
    );
};
