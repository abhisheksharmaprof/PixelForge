import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Filter, Bookmark, X, GitBranch, Save, Trash2, Plus,
    GripVertical, ArrowUp, ArrowDown, FilterX, ArrowUpDown,
    Download, MoreVertical, ChevronDown, ChevronRight,
    Search, SlidersHorizontal
} from 'lucide-react';
import { DataColumn } from '../../../types/mailMergeTypes';

interface DataRefinementScreenProps {
    data: any[];
    columns: DataColumn[];
    onSave: (data: any[], columns: DataColumn[]) => void;
    onCancel: () => void;
}

type FilterOp = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'is_true' | 'is_false' | 'is_empty' | 'not_empty';
type FilterLogic = 'AND' | 'OR';

interface FilterRule {
    id: string;
    field: string;
    operator: FilterOp;
    value: string;
    logic: FilterLogic; // Logic operator to the NEXT rule (or previous? usually connecting)
}

interface SortRule {
    id: string;
    field: string;
    direction: 'asc' | 'desc';
}

export const DataRefinementScreen: React.FC<DataRefinementScreenProps> = ({
    data: initialData,
    columns: initialColumns,
    onSave,
    onCancel
}) => {
    // State
    const [data, setData] = useState(initialData);
    const [columns, setColumns] = useState(initialColumns);
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [sorts, setSorts] = useState<SortRule[]>([]);

    // UI State
    const [editingCell, setEditingCell] = useState<{ rowIndex: number, colName: string } | null>(null);
    const [editingHeader, setEditingHeader] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'row' | 'col', index: number | string } | null>(null);

    // Derived Data (Filtered & Sorted)
    const processedData = useMemo(() => {
        let result = [...data];

        // 1. Filter
        if (filters.length > 0) {
            result = result.filter(row => {
                // Simplified logic: evaluate all rules. 
                // For a proper query builder, we need a recursive structure or distinct groups.
                // The provided HTML shows a linear list with "AND/OR" connectors between items.
                // Rule 1 [AND] Rule 2 [OR] Rule 3.

                // Evaluating linear logic:
                // res = Rule1
                // if (Rule1.logic === AND) res = res && Rule2
                // else res = res || Rule2

                if (filters.length === 0) return true;

                let match = evaluateRule(row, filters[0]);

                for (let i = 0; i < filters.length - 1; i++) {
                    const currentRule = filters[i];
                    const nextRule = filters[i + 1];
                    const nextMatch = evaluateRule(row, nextRule);

                    if (currentRule.logic === 'AND') {
                        match = match && nextMatch;
                    } else {
                        match = match || nextMatch;
                    }
                }
                return match;
            });
        }

        // 2. Sort
        if (sorts.length > 0) {
            result.sort((a, b) => {
                for (const sort of sorts) {
                    const valA = a[sort.field];
                    const valB = b[sort.field];

                    if (valA === valB) continue;

                    const comparison = valA < valB ? -1 : 1;
                    return sort.direction === 'asc' ? comparison : -comparison;
                }
                return 0;
            });
        }

        return result;
    }, [data, filters, sorts]);

    function evaluateRule(row: any, rule: FilterRule): boolean {
        const val = String(row[rule.field] || '').toLowerCase();
        const criterion = rule.value.toLowerCase();

        switch (rule.operator) {
            case 'equals': return val === criterion;
            case 'contains': return val.includes(criterion);
            case 'greater_than': return parseFloat(val) > parseFloat(criterion);
            case 'less_than': return parseFloat(val) < parseFloat(criterion);
            case 'is_true': return val === 'true' || val === '1' || val === 'yes';
            case 'is_false': return val === 'false' || val === '0' || val === 'no';
            case 'is_empty': return !val;
            case 'not_empty': return !!val;
            default: return true;
        }
    }

    // Handlers
    const addFilter = () => {
        setFilters([...filters, {
            id: Math.random().toString(36).substr(2, 9),
            field: columns[0]?.name || '',
            operator: 'contains',
            value: '',
            logic: 'AND'
        }]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const updateFilter = (id: string, updates: Partial<FilterRule>) => {
        setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const addSort = () => {
        setSorts([...sorts, {
            id: Math.random().toString(36).substr(2, 9),
            field: columns[0]?.name || '',
            direction: 'asc'
        }]);
    };

    const removeSort = (id: string) => {
        setSorts(sorts.filter(s => s.id !== id));
    };

    const updateSort = (id: string, updates: Partial<SortRule>) => {
        setSorts(sorts.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    // Grid Handlers
    const handleCellEdit = (rowIndex: number, colName: string, value: string) => {
        const newData = [...data];
        // Note: rowIndex here refers to 'processedData' index if we assume visual edit. 
        // But if filtering is active, we need to find the correct row in 'data'.
        // For simplicity in this edit-mode, maybe we should apply edits to the *filtered* view?
        // No, that's dangerous. We usually edit the source.

        // Strategy: find the row object and mutate it.
        // Or simpler: Disable filtering while editing? No.

        // Let's assume 'processedData' rows are references to 'data' rows (shallow copy).
        // If 'data' is array of objects, [...data] shallow copies the array but objects are same.
        // So mutating processedData[i] mutates data[k].

        // Ideally we shouldn't mutate state directly.
        // Let's use an ID if available, otherwise index is risky with filters.
        // We'll trust that for this prototype, we update the object reference.

        const row = processedData[rowIndex];
        row[colName] = value;

        // Force update (since we mutated object interior)
        setData([...data]);
    };

    const handleColumnRename = (oldName: string, newName: string) => {
        if (!newName || newName === oldName) return;

        // Update columns
        setColumns(columns.map(c => c.name === oldName ? { ...c, name: newName } : c));

        // Update data keys
        const newData = data.map(row => {
            const newRow = { ...row };
            newRow[newName] = newRow[oldName];
            delete newRow[oldName];
            return newRow;
        });
        setData(newData);
        setEditingHeader(null);
    };

    // Context Menu Handlers
    const handleContextMenu = (e: React.MouseEvent, type: 'row' | 'col', index: number | string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type, index });
    };

    const executeContextAction = (action: string) => {
        if (!contextMenu) return;
        const { type, index } = contextMenu;

        if (type === 'row' && typeof index === 'number') {
            if (action === 'delete') {
                // Find row in processedData
                const row = processedData[index];
                setData(data.filter(r => r !== row));
            } else if (action === 'make_header') {
                // Use this row values as headers
                const row = processedData[index];
                const newCols = columns.map(c => ({
                    ...c,
                    name: row[c.name] || c.name
                }));
                setColumns(newCols);
                // Remove this row
                setData(data.filter(r => r !== row));
            } else if (action === 'add_row_above') {
                // Insert empty row at index
                const newRow: Record<string, any> = {};
                columns.forEach(c => newRow[c.name] = '');
                const newData = [...data];
                // Note: index is in processedData, we need to find it in data.
                // For simplicity, we just add to top if filtered, or at index if not.
                // Real impl needs IDs.
                const actualIndex = data.indexOf(processedData[index]);
                if (actualIndex !== -1) {
                    newData.splice(actualIndex, 0, newRow);
                    setData(newData);
                }
            } else if (action === 'add_row_below') {
                const newRow: Record<string, any> = {};
                columns.forEach(c => newRow[c.name] = '');
                const newData = [...data];
                const actualIndex = data.indexOf(processedData[index]);
                if (actualIndex !== -1) {
                    newData.splice(actualIndex + 1, 0, newRow);
                    setData(newData);
                }
            }
        } else if (type === 'col' && typeof index === 'string') {
            const colName = index;
            const colIndex = columns.findIndex(c => c.name === colName);

            if (action === 'delete') {
                if (columns.length <= 1) return; // Prevent deleting last column
                setColumns(columns.filter(c => c.name !== colName));
            } else if (action === 'add_col_left') {
                const newColName = `New Column ${Math.floor(Math.random() * 1000)}`;
                const newCol: DataColumn = {
                    name: newColName, type: 'text', sampleValues: [], nonEmptyCount: 0, emptyCount: 0
                };
                const newCols = [...columns];
                newCols.splice(colIndex, 0, newCol);
                setColumns(newCols);
                // Update rows
                setData(data.map(row => ({ ...row, [newColName]: '' })));
            } else if (action === 'add_col_right') {
                const newColName = `New Column ${Math.floor(Math.random() * 1000)}`;
                const newCol: DataColumn = {
                    name: newColName, type: 'text', sampleValues: [], nonEmptyCount: 0, emptyCount: 0
                };
                const newCols = [...columns];
                newCols.splice(colIndex + 1, 0, newCol);
                setColumns(newCols);
                setData(data.map(row => ({ ...row, [newColName]: '' })));
            }
        }

        setContextMenu(null);
    };

    // Click away to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-slate-900 w-full h-full max-w-[1400px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Refine Data</h1>
                            <p className="text-xs text-slate-500">Filter, sort, and clean your data before importing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar: Filter & Sort */}
                    <div className="w-[350px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col overflow-hidden">

                        {/* Filters */}
                        <div className="flex-1 overflow-y-auto p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Filter size={16} /> Filters
                                </h2>
                                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">{filters.length}</span>
                            </div>

                            <div className="space-y-4">
                                {filters.map((filter, idx) => (
                                    <div key={filter.id} className="relative group">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={filter.field}
                                                    onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                                                    className="flex-1 text-sm bg-transparent border-none font-medium text-slate-700 dark:text-slate-200 focus:ring-0 p-0 cursor-pointer"
                                                >
                                                    {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                </select>
                                                <button onClick={() => removeFilter(filter.id)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    value={filter.operator}
                                                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOp })}
                                                    className="w-1/3 text-xs bg-slate-50 dark:bg-slate-900 border-none rounded text-slate-500 py-1 px-1"
                                                >
                                                    <option value="contains">Contains</option>
                                                    <option value="equals">Equals</option>
                                                    <option value="greater_than">&gt;</option>
                                                    <option value="less_than">&lt;</option>
                                                    <option value="is_true">Is True</option>
                                                    <option value="is_false">Is False</option>
                                                    <option value="is_empty">Is Empty</option>
                                                    <option value="not_empty">Not Empty</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={filter.value}
                                                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                                    className="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border-transparent focus:border-blue-500 rounded px-2 py-1 outline-none"
                                                    placeholder="Value..."
                                                />
                                            </div>
                                        </div>
                                        {/* Logic Connector */}
                                        {idx < filters.length - 1 && (
                                            <div className="absolute -bottom-3 left-6 z-10">
                                                <button
                                                    onClick={() => updateFilter(filter.id, { logic: filter.logic === 'AND' ? 'OR' : 'AND' })}
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm cursor-pointer transition-colors ${filter.logic === 'AND'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                        }`}
                                                >
                                                    {filter.logic}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addFilter} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 text-sm hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                    <Plus size={16} /> Add Filter
                                </button>
                            </div>
                        </div>

                        {/* Sorts */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <ArrowUpDown size={16} /> Sorts
                                </h2>
                                <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{sorts.length}</span>
                            </div>

                            <div className="space-y-4">
                                {sorts.map((sort, idx) => (
                                    <div key={sort.id} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                        <GripVertical size={16} className="text-slate-300 cursor-grab" />
                                        <div className="flex-1">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{idx === 0 ? 'Sort by' : 'Then by'}</div>
                                            <select
                                                value={sort.field}
                                                onChange={(e) => updateSort(sort.id, { field: e.target.value })}
                                                className="w-full text-sm bg-transparent border-none font-medium text-slate-700 dark:text-slate-200 focus:ring-0 p-0 cursor-pointer"
                                            >
                                                {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => updateSort(sort.id, { direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                                            className={`p-1.5 rounded flex items-center gap-1 text-xs font-bold transition-colors ${sort.direction === 'asc'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-orange-50 text-orange-600'
                                                }`}
                                        >
                                            {sort.direction === 'asc' ? 'ASC' : 'DESC'}
                                            {sort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        </button>
                                        <button onClick={() => removeSort(sort.id)} className="text-slate-400 hover:text-red-500 p-1">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addSort} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 text-sm hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                    <Plus size={16} /> Add Sort
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Data Grid */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 min-w-0">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="text-sm text-slate-500">
                                Showing <span className="font-bold text-slate-900 dark:text-white">{processedData.length}</span> of {data.length} records match filters
                            </div>
                            <div className="flex gap-2">
                                {((filters.length > 0) || (sorts.length > 0)) && (
                                    <button
                                        onClick={() => { setFilters([]); setSorts([]); }}
                                        className="text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <FilterX size={14} /> Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                    <tr>
                                        {columns.map((col, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 group relative min-w-[150px]"
                                                onContextMenu={(e) => handleContextMenu(e, 'col', col.name)}
                                            >
                                                {editingHeader === col.name ? (
                                                    <input
                                                        autoFocus
                                                        defaultValue={col.name}
                                                        onBlur={(e) => handleColumnRename(col.name, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleColumnRename(col.name, e.currentTarget.value);
                                                            if (e.key === 'Escape') setEditingHeader(null);
                                                        }}
                                                        className="w-full bg-white dark:bg-slate-800 border-blue-500 rounded px-1 py-0.5 outline-none text-xs"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className="cursor-pointer hover:text-blue-600 truncate"
                                                            onDoubleClick={() => setEditingHeader(col.name)}
                                                            title="Double click to rename"
                                                        >
                                                            {col.name}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleContextMenu(e, 'col', col.name)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity"
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                                    {processedData.slice(0, 100).map((row, rowIndex) => (
                                        <tr
                                            key={rowIndex}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                                            onContextMenu={(e) => handleContextMenu(e, 'row', rowIndex)}
                                        >
                                            {columns.map((col, colIndex) => (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 border-r border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate relative"
                                                    onDoubleClick={() => setEditingCell({ rowIndex, colName: col.name })}
                                                >
                                                    {editingCell?.rowIndex === rowIndex && editingCell?.colName === col.name ? (
                                                        <input
                                                            autoFocus
                                                            defaultValue={row[col.name]}
                                                            onBlur={(e) => {
                                                                handleCellEdit(rowIndex, col.name, e.target.value);
                                                                setEditingCell(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleCellEdit(rowIndex, col.name, e.currentTarget.value);
                                                                    setEditingCell(null);
                                                                }
                                                                if (e.key === 'Escape') setEditingCell(null);
                                                            }}
                                                            className="absolute inset-0 w-full h-full p-2 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 outline-none"
                                                        />
                                                    ) : (
                                                        String(row[col.name] || '')
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {processedData.length > 100 && (
                                        <tr>
                                            <td colSpan={columns.length} className="px-4 py-4 text-center text-slate-500 text-sm">
                                                And {processedData.length - 100} more rows...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready to import</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors">
                            Back
                        </button>
                        <button
                            onClick={() => onSave(processedData, columns)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save & Continue
                        </button>
                    </div>
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        className="fixed bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[160px] z-[60]"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        {contextMenu.type === 'row' ? (
                            <>
                                <button onClick={() => executeContextAction('make_header')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <ArrowUp size={14} /> Use as Header
                                </button>
                                <button onClick={() => executeContextAction('add_row_above')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <ArrowUp size={14} className="rotate-180" /> Add Row Above
                                </button>
                                <button onClick={() => executeContextAction('add_row_below')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <ArrowDown size={14} /> Add Row Below
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                <button onClick={() => executeContextAction('delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                    <Trash2 size={14} /> Remove Row
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setEditingHeader(String(contextMenu.index))} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <SlidersHorizontal size={14} /> Rename Column
                                </button>
                                <button onClick={() => executeContextAction('add_col_left')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <ChevronRight size={14} className="rotate-180" /> Add Column Left
                                </button>
                                <button onClick={() => executeContextAction('add_col_right')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <ChevronRight size={14} /> Add Column Right
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                <button onClick={() => executeContextAction('delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                    <Trash2 size={14} /> Delete Column
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
