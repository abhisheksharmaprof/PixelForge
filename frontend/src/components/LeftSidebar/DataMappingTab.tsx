import React, { useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useDataStore } from '../../store/dataStore';
import { Button } from '../Shared/Button';
import { Dropdown } from '../Shared/Dropdown';
import { Accordion } from '../Shared/Accordion';
import {
    FaLink,
    FaUnlink,
    FaCheckCircle,
    FaExclamationTriangle,
    FaMagic,
    FaEye,
} from 'react-icons/fa';
import './DataMappingTab.css';

export const DataMappingTab: React.FC = () => {
    const { canvas } = useCanvasStore();
    const {
        excelData,
        placeholders,
        mappings,
        mapPlaceholderToColumn,
        autoMapPlaceholders,
        validateMappings,
        setPreviewRow,
        previewRowIndex,
        scanForPlaceholders
    } = useDataStore();

    const [showPreview, setShowPreview] = useState(false);

    // Scan for placeholders on mount or refresh
    React.useEffect(() => {
        if (canvas) {
            scanForPlaceholders(canvas.getObjects());

            const handleModification = () => {
                scanForPlaceholders(canvas.getObjects());
            };

            canvas.on('object:added', handleModification);
            canvas.on('object:modified', handleModification);
            canvas.on('object:removed', handleModification);

            return () => {
                canvas.off('object:added', handleModification);
                canvas.off('object:modified', handleModification);
                canvas.off('object:removed', handleModification);
            };
        }
    }, [canvas]);

    // Auto-map placeholders
    const handleAutoMap = () => {
        const mapped = autoMapPlaceholders();
        alert(`Auto-mapped ${mapped} placeholder(s)`);
    };

    // Validate all mappings
    const handleValidate = () => {
        const isValid = validateMappings();
        if (isValid) {
            alert('All placeholders are correctly mapped!');
        } else {
            alert('Some placeholders are not mapped. Please check the list.');
        }
    };

    // Update preview with placeholder values
    const updatePreview = () => {
        if (!canvas || !excelData || !showPreview) return;

        const currentRow = excelData.rows[previewRowIndex];
        if (!currentRow) return;

        canvas.getObjects().forEach(obj => {
            const objAny = obj as any;

            // Update text placeholders
            // Simplistic check: if text contains {{name}} regex
            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                // This logic is complex because one text box can contain multiple placeholders.
                // For simplicity, we'll assume the whole text is replaced or simple regex replace.
                // Ideally, we store original text to revert.
                if (!objAny.originalText) {
                    objAny.originalText = (obj as any).text;
                }

                let newText = objAny.originalText;
                placeholders.forEach(p => {
                    const val = currentRow[mappings[p.name]] || '';
                    newText = newText.replace(new RegExp(`{{${p.name}}}`, 'g'), val);
                });

                (obj as any).set({ text: newText });
            }

            // Update QR/Barcodes
            if ((objAny.elementType === 'qrcode' || objAny.elementType === 'barcode') && objAny.isPlaceholder && objAny.placeholderName) {
                const col = mappings[objAny.placeholderName];
                const val = currentRow[col];
                if (val) {
                    if (objAny.elementType === 'qrcode') {
                        // Trigger QR update - trickier without factory access here, usually we'd call a method on the object or util
                        // For visual preview we might skip actual regen or mock it
                    }
                }
            }
        });

        canvas.renderAll();
    };

    // Revert preview
    const revertPreview = () => {
        if (!canvas) return;

        canvas.getObjects().forEach(obj => {
            const objAny = obj as any;
            if (objAny.originalText) {
                (obj as any).set({ text: objAny.originalText });
                delete objAny.originalText;
            }
        });
        canvas.renderAll();
    };

    // Toggle preview mode
    const togglePreview = () => {
        const nextState = !showPreview;
        setShowPreview(nextState);

        if (nextState) {
            updatePreview();
        } else {
            revertPreview();
        }
    };

    // Effect to update preview when row changes
    React.useEffect(() => {
        if (showPreview) {
            updatePreview();
        }
    }, [previewRowIndex]);

    // Get placeholder status
    const getPlaceholderStatus = (placeholder: any) => {
        if (!placeholder.isMapped) {
            return { status: 'unmapped', icon: <FaExclamationTriangle />, color: '#E74C3C' };
        }

        const columnName = mappings[placeholder.name];
        if (!columnName) {
            return { status: 'unmapped', icon: <FaExclamationTriangle />, color: '#E74C3C' };
        }

        return { status: 'mapped', icon: <FaCheckCircle />, color: '#2ECC71' };
    };

    if (!excelData) {
        return (
            <div className="data-mapping-tab no-data">
                <p>Please load an Excel file first to map placeholders.</p>
            </div>
        );
    }

    return (
        <div className="data-mapping-tab sidebar-tab-content">
            {/* Actions */}
            <div className="mapping-actions">
                <Button
                    variant="primary"
                    onClick={handleAutoMap}
                    className="w-full"
                    icon={<FaMagic />}
                >
                    Auto-Map Placeholders
                </Button>

                <Button
                    variant="secondary"
                    onClick={handleValidate}
                    className="w-full"
                >
                    Validate Mappings
                </Button>

                <Button
                    variant={showPreview ? 'primary' : 'secondary'}
                    onClick={togglePreview}
                    className="w-full"
                    icon={<FaEye />}
                >
                    {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
            </div>

            {/* Preview Row Selector */}
            {showPreview && (
                <div className="preview-row-selector">
                    <label>Preview with Row:</label>
                    <div className="row-navigation">
                        <Button
                            size="small"
                            onClick={() => setPreviewRow(Math.max(0, previewRowIndex - 1))}
                            disabled={previewRowIndex === 0}
                        >
                            ←
                        </Button>

                        <span className="row-counter">
                            {previewRowIndex + 1} / {excelData.totalRows}
                        </span>

                        <Button
                            size="small"
                            onClick={() => setPreviewRow(Math.min(excelData.totalRows - 1, previewRowIndex + 1))}
                            disabled={previewRowIndex >= excelData.totalRows - 1}
                        >
                            →
                        </Button>
                    </div>
                </div>
            )}

            {/* Placeholder List */}
            <Accordion title={`Placeholders (${placeholders.length})`} defaultOpen>
                {placeholders.length === 0 ? (
                    <div className="no-placeholders">
                        <p>No placeholders found in the template.</p>
                        <p>Add placeholder text elements (e.g., {"{{name}}"}) to get started.</p>
                    </div>
                ) : (
                    <div className="placeholders-list">
                        {placeholders.map(placeholder => {
                            const status = getPlaceholderStatus(placeholder);

                            return (
                                <div
                                    key={placeholder.id}
                                    className={`placeholder-item ${status.status}`}
                                >
                                    <div className="placeholder-header">
                                        <div className="placeholder-info">
                                            <span
                                                className="status-icon"
                                                style={{ color: status.color }}
                                            >
                                                {status.icon}
                                            </span>
                                            <span className="placeholder-name">
                                                {`{{${placeholder.name}}}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="placeholder-mapping">
                                        <Dropdown
                                            value={mappings[placeholder.name] || ''}
                                            onChange={(val) =>
                                                mapPlaceholderToColumn(placeholder.id, String(val))
                                            }
                                            options={excelData.columns.map(col => ({
                                                label: col.name,
                                                value: col.name,
                                            }))}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Accordion>
        </div>
    );
};
