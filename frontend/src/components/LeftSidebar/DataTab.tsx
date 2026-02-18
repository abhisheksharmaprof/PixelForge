import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { useDataStore } from '../../store/dataStore';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { Button } from '../Shared/Button';

import {
    Database,
    FileSpreadsheet,
    RefreshCw,
    LogOut,
    PlusCircle,
    Search,
    Type,
    Image as ImageIcon,
    Hash,
    Calendar,
    CheckSquare,
    List,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Eye,
    AlertCircle,
    CheckCircle2,
    LayoutTemplate
} from 'lucide-react';

const FIELD_TYPE_ICONS: Record<string, React.ReactNode> = {
    string: <Type size={18} className="text-slate-400" />,
    text: <Type size={18} className="text-slate-400" />,
    number: <Hash size={18} className="text-slate-400" />,
    date: <Calendar size={18} className="text-slate-400" />,
    boolean: <CheckSquare size={18} className="text-slate-400" />,
    image: <ImageIcon size={18} className="text-slate-400" />,
    link: <List size={18} className="text-slate-400" />,
};

// Reusable Collapsible Section
const CollapsibleSection: React.FC<{
    title: string;
    badge?: string | number;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, badge, icon, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-100">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-tight">{title}</h2>
                    {badge !== undefined && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{badge}</span>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${!isOpen ? '-rotate-90' : ''}`} />
            </div>
            {isOpen && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export const DataTab: React.FC = () => {
    // Connect to MailMergeStore
    const {
        dataSource,
        fields,
        disconnectDataSource,
        refreshDataSource,
        filteredRows,
        previewRecordIndex,
        setPreviewRecordIndex,

        // Filters & Sorts
        activeFilters,
        activeSorts,
        addFilter,
        removeFilter,
        addSort,
        removeSort,
        clearAllFilters
    } = useMailMergeStore();

    const { openModal } = useUIStore();
    const { canvas } = useCanvasStore();
    const { loadData } = useDataStore();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [scannedPlaceholders, setScannedPlaceholders] = useState<{ id: string; name: string; isMapped: boolean }[]>([]);

    // Scan canvas for {{placeholders}}
    const scanCanvas = () => {
        if (!canvas) return;
        const objects = canvas.getObjects();
        const found: { id: string; name: string; isMapped: boolean }[] = [];
        const regex = /\{\{([^}]+)\}\}/g;

        objects.forEach((obj: any) => {
            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                const text = obj.text || '';
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const name = match[1];
                    if (!found.some(p => p.name === name)) {
                        found.push({
                            id: obj.id || `ph_${name}`,
                            name: name,
                            isMapped: fields.some(f => f.name === name)
                        });
                    }
                }
            }
        });
        setScannedPlaceholders(found);
    };

    // Auto-scan on mount and when fields change
    useEffect(() => {
        scanCanvas();

        if (canvas) {
            const handleCanvasChange = () => scanCanvas();

            canvas.on('object:added', handleCanvasChange);
            canvas.on('object:removed', handleCanvasChange);
            canvas.on('text:changed', handleCanvasChange);

            return () => {
                canvas.off('object:added', handleCanvasChange);
                canvas.off('object:removed', handleCanvasChange);
                canvas.off('text:changed', handleCanvasChange);
            };
        }
    }, [canvas, fields]);


    // Filter State
    const [filterField, setFilterField] = useState('');
    const [filterOperator, setFilterOperator] = useState('contains');
    const [filterValue, setFilterValue] = useState('');

    const handleApplyFilter = () => {
        if (!filterField || !filterValue) return;
        addFilter({ field: filterField, operator: filterOperator as any, value: filterValue, logicOperator: 'AND' });
        setFilterValue(''); // Reset value for next filter
    };

    const handleBulkGenerate = () => {
        if (!dataSource) return;
        loadData(dataSource.rows, dataSource.columns);
        navigate('/bulk-generate');
    };

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* Data Source Section */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-tight">Data Source</h2>
                        {dataSource && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Connected</span>
                        )}
                    </div>

                    {dataSource ? (
                        <>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-3">
                                <div className="flex gap-3 items-start">
                                    <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <FileSpreadsheet className="text-emerald-600" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate" title={dataSource.name}>{dataSource.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {dataSource.rowCount} rows • {dataSource.type.toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            className="p-1 hover:text-blue-500 transition-colors text-slate-400"
                                            title="Replace"
                                            onClick={() => openModal('dataSourceConnection')}
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button
                                            className="p-1 hover:text-red-500 transition-colors text-slate-400"
                                            title="Disconnect"
                                            onClick={disconnectDataSource}
                                        >
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-0 uppercase tracking-wide text-[11px]"
                                onClick={handleBulkGenerate}
                            >
                                <LayoutTemplate size={14} className="mr-2" />
                                Bulk Generate
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={() => openModal('dataSourceConnection')}
                                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                            >
                                <PlusCircle size={18} />
                                Connect Data Source
                            </button>
                            <p className="text-center text-[10px] text-slate-400">Supports .csv, .json, .xlsx</p>
                        </div>
                    )}
                </div>

                {/* Available Fields Section */}
                <CollapsibleSection title="Available Fields" badge={fields.length} defaultOpen={true}>
                    {fields.length > 0 ? (
                        <>
                            <div className="relative mb-3">
                                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 text-slate-700 outline-none transition-all"
                                    placeholder="Search fields..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                {fields
                                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((field, idx) => (
                                        <div
                                            key={idx}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('text/plain', `{{${field.name}}}`); // Drag text pattern
                                                e.dataTransfer.setData('application/mailmerge-field', field.name);
                                                e.dataTransfer.setData('application/mailmerge-field-type', field.type);
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-100 transition-colors"
                                        >
                                            {FIELD_TYPE_ICONS[field.type] || <Type size={18} className="text-slate-400" />}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-700 truncate" title={field.name}>{field.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate">Ex: {field.sampleValues?.[0] || '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <Database size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-xs text-slate-400">Connect data to see fields</p>
                        </div>
                    )}
                </CollapsibleSection>

                {/* Mappings / Placeholders Section */}
                <CollapsibleSection title="Detected Placeholders" badge={scannedPlaceholders.length} defaultOpen={false}>
                    {scannedPlaceholders.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 mb-2 italic">
                                Fields are mapped automatically by name matching.
                            </p>
                            {scannedPlaceholders.map((ph, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-lg border border-slate-100 p-2 flex items-center justify-between">
                                    <code className="text-[11px] font-mono font-bold text-slate-600 px-1.5 py-0.5 bg-slate-200/50 rounded">
                                        {`{{${ph.name}}}`}
                                    </code>

                                    {ph.isMapped ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-100">
                                            <CheckCircle2 size={10} />
                                            Mapped
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-100">
                                            <AlertCircle size={10} />
                                            Missing
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={scanCanvas}
                                className="w-full mt-2 py-1.5 text-xs text-blue-500 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
                            >
                                <RefreshCw size={12} /> Re-scan Canvas
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs text-slate-400 mb-2">No <code>{`{{tags}}`}</code> found on canvas.</p>
                            <button
                                onClick={scanCanvas}
                                className="text-[10px] px-3 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                            >
                                Scan Now
                            </button>
                        </div>
                    )}
                </CollapsibleSection>

                {/* Filters */}
                <CollapsibleSection title="Filter Data" icon={<Filter size={12} />} defaultOpen={false}>
                    {dataSource ? (
                        <div className="space-y-4">
                            {/* Active Filters List */}
                            {activeFilters.length > 0 && (
                                <div className="space-y-1 mb-2">
                                    {activeFilters.map(filter => (
                                        <div key={filter.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
                                            <span className="text-[10px] text-blue-800 font-medium">
                                                {filter.field} {filter.operator} "{filter.value}"
                                            </span>
                                            <button onClick={() => removeFilter(filter.id)} className="text-blue-400 hover:text-red-500">
                                                <LogOut size={12} className="rotate-180" /> {/* Using LogOut as 'X'ish icon or use X */}
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={clearAllFilters} className="text-[10px] text-slate-400 underline hover:text-slate-600">
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* Add Filter */}
                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                                <h4 className="text-[11px] font-bold text-slate-700 mb-2 uppercase">Add Filter</h4>
                                <div className="space-y-2">
                                    <select
                                        className="w-full text-xs p-1.5 border border-slate-200 rounded"
                                        value={filterField}
                                        onChange={(e) => setFilterField(e.target.value)}
                                    >
                                        <option value="">Select Field</option>
                                        {fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-1/3 text-xs p-1.5 border border-slate-200 rounded"
                                            value={filterOperator}
                                            onChange={(e) => setFilterOperator(e.target.value)}
                                        >
                                            <option value="contains">Contains</option>
                                            <option value="equals">Equals</option>
                                            <option value="startsWith">Starts</option>
                                            <option value="greaterThan">&gt;</option>
                                            <option value="lessThan">&lt;</option>
                                        </select>
                                        <input
                                            className="w-2/3 text-xs p-1.5 border border-slate-200 rounded"
                                            placeholder="Value"
                                            value={filterValue}
                                            onChange={(e) => setFilterValue(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyFilter}
                                        disabled={!filterField || !filterValue}
                                        className="w-full py-1.5 mt-1 text-xs bg-slate-800 text-white rounded hover:bg-slate-900 disabled:opacity-50"
                                    >
                                        Add Filter
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-xs text-slate-400">No data connected</div>
                    )}
                </CollapsibleSection>
            </div>

            {/* Bottom Preview Section */}
            {dataSource && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 shrink-0">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Preview Data</span>
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${dataSource ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                <span className="text-[11px] font-bold text-blue-500 uppercase">Active</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                            <button
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                                onClick={() => setPreviewRecordIndex(Math.max(0, previewRecordIndex - 1))}
                                disabled={previewRecordIndex === 0}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-800">
                                    Row {previewRecordIndex + 1} of {filteredRows.length}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                                    {filteredRows[previewRecordIndex] ? Object.values(filteredRows[previewRecordIndex])[0] : '-'}
                                </span>
                            </div>
                            <button
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                                onClick={() => setPreviewRecordIndex(Math.min(filteredRows.length - 1, previewRecordIndex + 1))}
                                disabled={previewRecordIndex >= filteredRows.length - 1}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-lg text-sm font-bold shadow-md transition-all border-0"
                            onClick={() => openModal('dataPreview')} // Re-using DataPreview modal but ensures it uses mailMergeStore data?
                        // Wait, DataPreviewModal implies it looks at useDataStore. 
                        // I should verify DataPreviewModal.
                        >
                            <Eye size={16} className="mr-2" />
                            View Full Table
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
