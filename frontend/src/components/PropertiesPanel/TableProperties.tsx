import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { StitchAccordion } from '../common/StitchAccordion';
import { StitchSlider } from '../common/StitchSlider';
import { StitchColorPicker } from '../common/StitchColorPicker';
import { Grid, Layout, Square, Table as TableIcon, Database } from 'lucide-react';
import { FabricTable } from '../Canvas/objects/FabricTable';
import { useMailMergeStore } from '../../store/mailMergeStore';

export const TableProperties: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { dataSource, fields } = useMailMergeStore();
    const [tick, setTick] = useState(0);

    const [activeCellCoord, setActiveCellCoord] = useState<{ row: number, col: number } | null>(null);

    // Ensure we have a table selected
    const table = selectedObjects[0] as FabricTable;
    if (!table || (table.type !== 'table' && (table as any).elementType !== 'table')) return null;

    // Helper to update property
    const updateTable = (updates: Partial<FabricTable> | any) => {
        if (!canvas) return;
        console.log('[DEBUG TableProperties] updateTable called with:', updates);
        console.log('[DEBUG TableProperties] Total canvas objects:', canvas.getObjects().length);
        table.set(updates);
        console.log('[DEBUG TableProperties] table properties after set:', {
            cellPadding: table.cellPadding,
            hasHeaderRow: table.hasHeaderRow,
            activeCell: table.activeCell
        });
        table.updateLayout();
        table.setCoords();
        canvas.requestRenderAll();
        setTick(t => t + 1);
    };

    const updateCell = (property: string, value: any) => {
        if (!canvas || !activeCellCoord) return;
        table.setCellProperty(activeCellCoord.row, activeCellCoord.col, property, value);
        canvas.renderAll();
        setTick(t => t + 1);
    };

    // Listen for external updates
    useEffect(() => {
        if (table) {
            const handleModification = () => setTick(t => t + 1);
            table.on('modified', handleModification);
            table.on('scaling', handleModification);

            // Sync local active cell with table
            setActiveCellCoord(table.activeCell);

            return () => {
                table.off('modified', handleModification);
                table.off('scaling', handleModification);
            };
        }
    }, [table]);

    const activeCell = activeCellCoord ? table.cells[activeCellCoord.row][activeCellCoord.col] : null;

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--stitch-border)]">
                <div className="flex items-center gap-2">
                    <TableIcon size={16} className="text-[var(--stitch-text-secondary)]" />
                    <h3 className="text-sm font-semibold text-[var(--stitch-text-primary)]">Table</h3>
                </div>
                <div className="text-xs text-[var(--stitch-text-tertiary)]">
                    {table.rows} Rows × {table.columns} Cols
                </div>
            </div>

            {/* 1. Layout */}
            <StitchAccordion title="Layout" icon={<Layout size={16} />} defaultOpen>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                            <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Rows</label>
                            <span className="text-sm font-medium text-slate-700">{table.rows}</span>
                        </div>
                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                            <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Columns</label>
                            <span className="text-sm font-medium text-slate-700">{table.columns}</span>
                        </div>
                    </div>

                    <StitchSlider
                        label="Cell Padding"
                        min={0}
                        max={20}
                        value={table.cellPadding || 5}
                        onChange={(v) => updateTable({ cellPadding: v })}
                    />
                </div>
            </StitchAccordion>

            {/* 2. Appearance */}
            <StitchAccordion title="Appearance" icon={<Square size={16} />}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Borders</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <StitchColorPicker
                                    color={table.tableBorderColor || '#ccc'}
                                    onChange={(c) => updateTable({ tableBorderColor: c })}
                                />
                            </div>
                            <div className="w-24">
                                <StitchSlider
                                    label="Width"
                                    min={0}
                                    max={10}
                                    value={table.tableBorderWidth || 1}
                                    onChange={(v) => updateTable({ tableBorderWidth: v })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </StitchAccordion>

            {/* 3. Header & Alternating Rows */}
            <StitchAccordion title="Row Styling" icon={<Grid size={16} />}>
                <div className="space-y-4">
                    {/* Header Row */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Header Row</label>
                            <input
                                type="checkbox"
                                checked={table.hasHeaderRow}
                                onChange={(e) => updateTable({ hasHeaderRow: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                        {table.hasHeaderRow && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Background</label>
                                    <StitchColorPicker
                                        color={table.headerBackgroundColor || '#f0f0f0'}
                                        onChange={(c) => updateTable({ headerBackgroundColor: c })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Text Color</label>
                                    <StitchColorPicker
                                        color={table.headerTextColor || '#000000'}
                                        onChange={(c) => updateTable({ headerTextColor: c })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Alternate Rows */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Alternate Rows</label>
                            <input
                                type="checkbox"
                                checked={table.alternateRows}
                                onChange={(e) => updateTable({ alternateRows: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                        {table.alternateRows && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Alternate Background</label>
                                <StitchColorPicker
                                    color={table.alternateRowBackgroundColor || '#f9f9f9'}
                                    onChange={(c) => updateTable({ alternateRowBackgroundColor: c })}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </StitchAccordion>

            {/* 4. Cell Properties */}
            <StitchAccordion title="Cell Properties" icon={<Square size={16} />} defaultOpen={!!activeCell}>
                <div className="space-y-4">
                    {!activeCell ? (
                        <div className="text-xs text-slate-400 italic p-2 text-center bg-slate-50 rounded border border-dashed border-slate-200">
                            Select a cell on the canvas to edit its properties
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                                <span className="text-xs font-semibold text-blue-700">Cell R{activeCellCoord!.row + 1}, C{activeCellCoord!.col + 1}</span>
                                <div className="flex gap-2">
                                    {(table.selectionRange && (table.selectionRange.startRow !== table.selectionRange.endRow || table.selectionRange.startCol !== table.selectionRange.endCol)) && (
                                        <button
                                            className="text-[10px] text-blue-600 font-bold hover:underline"
                                            onClick={() => {
                                                table.mergeSelectedCells();
                                                setTick(t => t + 1);
                                            }}
                                        >
                                            Merge
                                        </button>
                                    )}
                                    {(activeCell && (activeCell.rowSpan > 1 || activeCell.colSpan > 1)) && (
                                        <button
                                            className="text-[10px] text-red-600 font-bold hover:underline"
                                            onClick={() => {
                                                table.unmergeCells(activeCellCoord!.row, activeCellCoord!.col);
                                                setTick(t => t + 1);
                                            }}
                                        >
                                            Unmerge
                                        </button>
                                    )}
                                    <button
                                        className="text-[10px] text-slate-500 hover:underline"
                                        onClick={() => {
                                            table.setActiveCell(null, null);
                                            setActiveCellCoord(null);
                                            canvas?.renderAll();
                                        }}
                                    >
                                        Deselect
                                    </button>
                                </div>
                            </div>

                            {/* Appearance */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Background</label>
                                    <StitchColorPicker
                                        color={activeCell.backgroundColor || 'transparent'}
                                        onChange={(c) => updateCell('backgroundColor', c)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Text Color</label>
                                    <StitchColorPicker
                                        color={activeCell.textColor || '#000000'}
                                        onChange={(c) => updateCell('textColor', c)}
                                    />
                                </div>
                            </div>

                            {/* Font */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Font Size</label>
                                    <input
                                        type="number"
                                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                                        value={activeCell.fontSize}
                                        onChange={(e) => updateCell('fontSize', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Weight</label>
                                    <select
                                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                                        value={activeCell.fontWeight}
                                        onChange={(e) => updateCell('fontWeight', e.target.value)}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </div>
                            </div>

                            {/* Alignment */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Alignment</label>
                                <div className="flex gap-2">
                                    <button
                                        className={`flex-1 p-1.5 border rounded text-xs ${activeCell.textAlign === 'left' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200'}`}
                                        onClick={() => updateCell('textAlign', 'left')}
                                    >
                                        Left
                                    </button>
                                    <button
                                        className={`flex-1 p-1.5 border rounded text-xs ${activeCell.textAlign === 'center' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200'}`}
                                        onClick={() => updateCell('textAlign', 'center')}
                                    >
                                        Center
                                    </button>
                                    <button
                                        className={`flex-1 p-1.5 border rounded text-xs ${activeCell.textAlign === 'right' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200'}`}
                                        onClick={() => updateCell('textAlign', 'right')}
                                    >
                                        Right
                                    </button>
                                </div>
                            </div>

                            {/* Row / Column Layout */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Layout</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400">Row Height</label>
                                        <input
                                            type="number"
                                            className="w-full text-xs p-1.5 rounded border border-slate-300"
                                            value={table.rowHeights[activeCellCoord!.row]}
                                            onChange={(e) => {
                                                table.resizeRow(activeCellCoord!.row, parseInt(e.target.value));
                                                canvas?.renderAll();
                                                setTick(t => t + 1);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400">Col Width</label>
                                        <input
                                            type="number"
                                            className="w-full text-xs p-1.5 rounded border border-slate-300"
                                            value={table.columnWidths[activeCellCoord!.col]}
                                            onChange={(e) => {
                                                table.resizeColumn(activeCellCoord!.col, parseInt(e.target.value));
                                                canvas?.renderAll();
                                                setTick(t => t + 1);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </StitchAccordion>

            {/* 5. Data Binding */}
            <StitchAccordion title="Data Binding" icon={<Database size={16} />}>
                <div className="space-y-4">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 mb-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Active Data Source</div>
                        {dataSource ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 truncate">{dataSource.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Connected</span>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic">No data source connected</div>
                        )}
                    </div>

                    {dataSource && (
                        <>
                            <StitchSlider
                                label="Preview Rows"
                                min={1}
                                max={20}
                                value={table.visibleRowCount || 5}
                                onChange={(v) => updateTable({ visibleRowCount: v })}
                            />

                            <div className="h-px bg-slate-200 my-2" />

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">Column Mapping</label>
                                    <button
                                        className="text-[10px] text-blue-600 hover:underline"
                                        onClick={() => {
                                            const newMapping: Record<number, string> = {};
                                            fields.slice(0, table.columns).forEach((f, idx) => {
                                                newMapping[idx] = f.name;
                                            });
                                            table.bindToDataSource(dataSource.id, newMapping);
                                            canvas?.renderAll();
                                            setTick(t => t + 1);
                                        }}
                                    >
                                        Auto-Map
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {Array.from({ length: table.columns }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-slate-500 w-6 flex-shrink-0">#{i + 1}</span>
                                            <select
                                                className="flex-1 text-xs p-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                                                value={table.columnMapping?.[i] || ''}
                                                onChange={(e) => {
                                                    const newMapping = { ...(table.columnMapping || {}) };
                                                    if (e.target.value) {
                                                        newMapping[i] = e.target.value;
                                                    } else {
                                                        delete newMapping[i];
                                                    }
                                                    table.bindToDataSource(dataSource.id, newMapping);
                                                    canvas?.renderAll();
                                                    setTick(t => t + 1);
                                                }}
                                            >
                                                <option value="">(Static)</option>
                                                {fields.map(f => (
                                                    <option key={f.id} value={f.name}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </StitchAccordion>
        </div>
    );
};
