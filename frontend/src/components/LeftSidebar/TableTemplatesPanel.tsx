import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUIStore } from '../../store/uiStore';
import { FabricTable } from '../Canvas/objects/FabricTable';
import { Grid, Table as TableIcon, Layout, List } from 'lucide-react';

export const TableTemplatesPanel: React.FC = () => {
    const { canvas } = useCanvasStore();

    const addTable = (rows: number, cols: number, options: any = {}) => {
        if (!canvas) return;

        const table = new FabricTable({
            rows,
            columns: cols,
            ...options
        });

        // Center on canvas
        const center = canvas.getCenter();
        table.set({
            left: center.left,
            top: center.top,
            originX: 'center',
            originY: 'center',
        });

        canvas.add(table);
        canvas.setActiveObject(table);
        canvas.renderAll();

        // Explicitly set selection so the properties panel opens
        useSelectionStore.getState().setSelection([table]);
        useUIStore.getState().setRightPanelOpen(true);
    };

    const handleDragStart = (e: React.DragEvent, rows: number, cols: number, options: any = {}) => {
        const dragData = {
            type: 'table',
            rows,
            cols,
            options
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col h-full bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Table Templates</h3>

            <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Basic Grids</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, 3, 3)}
                        onClick={() => addTable(3, 3)}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all group"
                    >
                        <Grid size={24} className="text-slate-400 group-hover:text-indigo-500 mb-2" />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-700">3x3 Grid</span>
                    </button>
                    <button
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, 4, 4)}
                        onClick={() => addTable(4, 4)}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all group"
                    >
                        <Grid size={24} className="text-slate-400 group-hover:text-indigo-500 mb-2" />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-700">4x4 Grid</span>
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Data Tables</h4>
                <div className="grid grid-cols-1 gap-3">
                    <button
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, 5, 4, { rowHeights: [40, 30, 30, 30, 30] })}
                        onClick={() => addTable(5, 4, {
                            rowHeights: [40, 30, 30, 30, 30],
                            cells: undefined // Default
                        })}
                        className="flex items-center p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all group text-left"
                    >
                        <TableIcon size={20} className="text-slate-400 group-hover:text-indigo-500 mr-3" />
                        <div>
                            <span className="block text-xs font-medium text-slate-700 group-hover:text-indigo-700">Header Table</span>
                            <span className="block text-[10px] text-slate-400">5 Rows with Header</span>
                        </div>
                    </button>

                    <button
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, 3, 2)}
                        onClick={() => addTable(3, 2, {})}
                        className="flex items-center p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all group text-left"
                    >
                        <List size={20} className="text-slate-400 group-hover:text-indigo-500 mr-3" />
                        <div>
                            <span className="block text-xs font-medium text-slate-700 group-hover:text-indigo-700">Simple List</span>
                            <span className="block text-[10px] text-slate-400">2 Columns</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="mt-auto p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2">
                    <Layout size={16} className="text-blue-500 mt-0.5" />
                    <p className="text-[10px] text-blue-700 leading-tight">
                        Drag edges to resize columns/rows. Double click cells to edit content.
                    </p>
                </div>
            </div>
        </div>
    );
};
