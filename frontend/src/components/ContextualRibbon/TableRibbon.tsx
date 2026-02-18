import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { StitchColorPicker } from '../common/StitchColorPicker';
import { StitchButton } from '../common/StitchButton';
import { fabric } from 'fabric';
import {
    Plus, Trash2, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
    Table as TableIcon, Square, AlignLeft, AlignCenter, AlignRight,
    Type, Grid, Maximize
} from 'lucide-react';
import { FabricTable } from '../Canvas/objects/FabricTable';

export const TableRibbon: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const [tick, setTick] = useState(0);

    const table = selectedObjects[0] as FabricTable;

    useEffect(() => {
        if (table) {
            const handleModification = () => setTick(t => t + 1);
            table.on('modified', handleModification);
            return () => {
                table.off('modified', handleModification);
            };
        }
    }, [table]);

    if (!table || table.type !== 'table') return null;

    const handleAction = (action: () => void) => {
        if (!canvas) return;
        action();
        table.setCoords();
        canvas.renderAll();
        setTick(t => t + 1);
    };

    return (
        <div className="flex items-center gap-4 px-4 h-full w-full">
            <div className="flex items-center gap-2">
                <TableIcon size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Table</span>
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Merge/Unmerge */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Selection</span>
                {(table.selectionRange && (table.selectionRange.startRow !== table.selectionRange.endRow || table.selectionRange.startCol !== table.selectionRange.endCol)) && (
                    <StitchButton size="sm" variant="ghost" onClick={() => handleAction(() => table.mergeSelectedCells())} title="Merge Cells">
                        <Square size={14} className="fill-slate-200" />
                    </StitchButton>
                )}
                {table.activeCell && (table.cells[table.activeCell.row][table.activeCell.col].rowSpan > 1 || table.cells[table.activeCell.row][table.activeCell.col].colSpan > 1) && (
                    <StitchButton size="sm" variant="ghost" onClick={() => handleAction(() => table.unmergeCells(table.activeCell!.row, table.activeCell!.col))} title="Unmerge Cells">
                        <Grid size={14} />
                    </StitchButton>
                )}
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Cell Background */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Fill</span>
                <StitchColorPicker
                    color={table.activeCell ? table.cells[table.activeCell.row][table.activeCell.col].backgroundColor : 'transparent'}
                    onChange={(color) => {
                        if (table.activeCell) {
                            handleAction(() => table.setCellProperty(table.activeCell!.row, table.activeCell!.col, 'backgroundColor', color));
                        }
                    }}
                />
            </div>

            <div className="w-px h-6 bg-[var(--stitch-border)]" />

            {/* Cell Alignment */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Align</span>
                <div className="flex bg-slate-100 rounded p-0.5">
                    <StitchButton
                        size="sm"
                        variant={table.activeCell && table.cells[table.activeCell.row][table.activeCell.col].textAlign === 'left' ? 'secondary' : 'ghost'}
                        onClick={() => handleAction(() => table.setCellProperty(table.activeCell!.row, table.activeCell!.col, 'textAlign', 'left'))}
                        title="Align Left"
                        disabled={!table.activeCell}
                    >
                        <AlignLeft size={14} />
                    </StitchButton>
                    <StitchButton
                        size="sm"
                        variant={table.activeCell && table.cells[table.activeCell.row][table.activeCell.col].textAlign === 'center' ? 'secondary' : 'ghost'}
                        onClick={() => handleAction(() => table.setCellProperty(table.activeCell!.row, table.activeCell!.col, 'textAlign', 'center'))}
                        title="Align Center"
                        disabled={!table.activeCell}
                    >
                        <AlignCenter size={14} />
                    </StitchButton>
                    <StitchButton
                        size="sm"
                        variant={table.activeCell && table.cells[table.activeCell.row][table.activeCell.col].textAlign === 'right' ? 'secondary' : 'ghost'}
                        onClick={() => handleAction(() => table.setCellProperty(table.activeCell!.row, table.activeCell!.col, 'textAlign', 'right'))}
                        title="Align Right"
                        disabled={!table.activeCell}
                    >
                        <AlignRight size={14} />
                    </StitchButton>
                </div>
            </div>
        </div>
    );
};
