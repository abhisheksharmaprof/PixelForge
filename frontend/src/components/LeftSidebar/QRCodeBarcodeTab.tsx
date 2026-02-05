import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useDataStore } from '../../store/dataStore';
import { ElementFactory } from '../../utils/elementFactory';
import { Button } from '../Shared/Button';
import { Input } from '../Shared/Input';
import { Dropdown } from '../Shared/Dropdown';
import { Accordion } from '../Shared/Accordion';
import { ColorPicker } from '../Shared/ColorPicker';
import { FaQrcode, FaBarcode } from 'react-icons/fa';
import './QRCodeBarcodeTab.css';

export const QRCodeBarcodeTab: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { excelData } = useDataStore();

    const [qrConfig, setQrConfig] = useState({
        data: 'https://example.com',
        isPlaceholder: false,
        placeholderName: '',
        size: 200,
        errorCorrection: 'M' as 'L' | 'M' | 'Q' | 'H',
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        margin: 1,
    });

    const [barcodeConfig, setBarcodeConfig] = useState({
        data: '1234567890',
        isPlaceholder: false,
        placeholderName: '',
        format: 'CODE128' as 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39',
        width: 300,
        height: 100,
        displayValue: true,
        fontSize: 14,
        textAlign: 'center' as 'left' | 'center' | 'right',
        lineColor: '#000000',
        backgroundColor: '#FFFFFF',
    });

    // Create QR Code
    const createQRCode = async () => {
        if (!canvas) return;

        try {
            const qrElement = await ElementFactory.createQRCode(
                qrConfig.isPlaceholder ? `{{${qrConfig.placeholderName}}}` : qrConfig.data,
                {
                    left: 100,
                    top: 100,
                    width: qrConfig.size,
                }
            );

            (qrElement as any).isPlaceholder = qrConfig.isPlaceholder;
            if (qrConfig.isPlaceholder) {
                (qrElement as any).placeholderName = qrConfig.placeholderName;
            }

            canvas.add(qrElement);
            canvas.setActiveObject(qrElement);
            canvas.renderAll();
        } catch (error) {
            console.error('Failed to create QR code:', error);
            alert('Failed to create QR code. Please try again.');
        }
    };

    // Create Barcode
    const createBarcode = async () => {
        if (!canvas) return;

        try {
            const barcodeElement = await ElementFactory.createBarcode(
                barcodeConfig.isPlaceholder
                    ? `{{${barcodeConfig.placeholderName}}}`
                    : barcodeConfig.data,
                {
                    left: 100,
                    top: 100,
                    format: barcodeConfig.format,
                    height: barcodeConfig.height,
                    displayValue: barcodeConfig.displayValue,
                    fontSize: barcodeConfig.fontSize,
                    textAlign: barcodeConfig.textAlign,
                    lineColor: barcodeConfig.lineColor,
                    backgroundColor: barcodeConfig.backgroundColor,
                }
            );

            (barcodeElement as any).isPlaceholder = barcodeConfig.isPlaceholder;
            if (barcodeConfig.isPlaceholder) {
                (barcodeElement as any).placeholderName = barcodeConfig.placeholderName;
            }

            canvas.add(barcodeElement);
            canvas.setActiveObject(barcodeElement);
            canvas.renderAll();
        } catch (error) {
            console.error('Failed to create barcode:', error);
            alert('Failed to create barcode. Please check the data format and try again.');
        }
    };

    return (
        <div className="qrcode-barcode-tab sidebar-tab-content">
            {/* QR Code Section */}
            <Accordion title="QR Code" defaultOpen>
                <div className="qr-config">
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={qrConfig.isPlaceholder}
                                onChange={(e) =>
                                    setQrConfig(prev => ({ ...prev, isPlaceholder: e.target.checked }))
                                }
                            />
                            Dynamic from Data
                        </label>
                    </div>

                    {!qrConfig.isPlaceholder ? (
                        <div className="form-group">
                            <label>QR Data</label>
                            <Input
                                type="text"
                                value={qrConfig.data}
                                onChange={(e) =>
                                    setQrConfig(prev => ({ ...prev, data: e.target.value }))
                                }
                                placeholder="Enter URL or text"
                            />
                        </div>
                    ) : (
                        excelData && (
                            <div className="form-group">
                                <label>Data Column</label>
                                <Dropdown
                                    value={qrConfig.placeholderName}
                                    onChange={(value) =>
                                        setQrConfig(prev => ({ ...prev, placeholderName: String(value) }))
                                    }
                                    options={excelData.columns.map(col => ({
                                        label: col.name,
                                        value: col.name,
                                    }))}
                                />
                            </div>
                        )
                    )}

                    <Button
                        variant="primary"
                        onClick={createQRCode}
                        className="w-full"
                        disabled={qrConfig.isPlaceholder && !qrConfig.placeholderName}
                    >
                        Create QR Code
                    </Button>
                </div>
            </Accordion>

            {/* Barcode Section */}
            <Accordion title="Barcode">
                <div className="barcode-config">
                    <div className="form-group">
                        <label>Barcode Data</label>
                        <Input
                            type="text"
                            value={barcodeConfig.data}
                            onChange={(e) => setBarcodeConfig(prev => ({ ...prev, data: e.target.value }))}
                        />
                    </div>

                    <Button
                        variant="primary"
                        onClick={createBarcode}
                        className="w-full"
                    >
                        Create Barcode
                    </Button>
                </div>
            </Accordion>
        </div>
    );
};
