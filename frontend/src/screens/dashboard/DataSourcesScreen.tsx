import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import {
    UploadCloud, Settings, Database, Table, Edit2, Trash2,
    Check, X, FileText, ArrowUp, ArrowDown, Layout, Info
} from 'lucide-react';
import { useDataSourceStore } from '../../store/dataSourceStore';
import { useDataStore } from '../../store/dataStore';
import { DataSource, DataColumn } from '../../types/mailMergeTypes';
import { DataRefinementScreen } from './components/DataRefinementScreen';

const DataSourcesScreen: React.FC = () => {
    const navigate = useNavigate();
    const { addSource, savedSources, removeSource, updateSource } = useDataSourceStore();
    const { loadData } = useDataStore();

    const [activeTab, setActiveTab] = useState<'upload' | 'saved'>('upload');
    const [isRefining, setIsRefining] = useState(false);

    // State for Editing
    const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');

    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [columns, setColumns] = useState<DataColumn[]>([]);
    const [fullData, setFullData] = useState<any[]>([]);

    const [fileFormat, setFileFormat] = useState<'csv' | 'json' | 'excel'>('csv');
    const [delimiter, setDelimiter] = useState(',');
    const [hasHeader, setHasHeader] = useState(true);
    const [headerRowIndex, setHeaderRowIndex] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial file processing options
    useEffect(() => {
        if (file) {
            processFile(file);
        }
    }, [file, hasHeader, headerRowIndex, delimiter, fileFormat]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const droppedFile = acceptedFiles[0];
        if (droppedFile) {
            setFile(droppedFile);
            // Auto-detect format
            if (droppedFile.name.endsWith('.csv')) setFileFormat('csv');
            else if (droppedFile.name.endsWith('.json')) setFileFormat('json');
            else if (droppedFile.name.match(/\.xls(x)?$/)) setFileFormat('excel');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/json': ['.json'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const processFile = async (currentFile: File) => {
        setIsProcessing(true);
        try {
            // Check if currentFile is actually a File object with arrayBuffer method
            // When rehydrated from storage, it might be a plain object
            if (!currentFile || typeof currentFile.arrayBuffer !== 'function') {
                console.warn("File object is missing or invalid (likely rehydrated from storage). Skipping file processing.");
                // If we have existing fullData, we might want to keep it?
                // But processFile is usually called when 'file' changes.
                // If this is a saved source 'edit', we should have handled it in handleEditSource
                return;
            }

            const buffer = await currentFile.arrayBuffer();
            let jsonData: any[] = [];
            let cols: DataColumn[] = [];

            if (fileFormat === 'excel' || fileFormat === 'csv') { // Use XLSX for CSV too for consistency if needed, but text parsing is fine
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const opts: XLSX.Sheet2JSONOpts = {
                    header: hasHeader ? undefined : 1,
                    range: hasHeader ? (headerRowIndex - 1) : 0,
                };
                jsonData = XLSX.utils.sheet_to_json(sheet, opts);
            } else if (fileFormat === 'json') {
                const text = await currentFile.text();
                jsonData = JSON.parse(text);
            }

            // Normalization
            if (jsonData.length > 0) {
                if (Array.isArray(jsonData[0])) {
                    // Array of arrays (no header)
                    const maxCols = Math.max(...jsonData.map(r => (r as any[]).length));
                    cols = Array.from({ length: maxCols }, (_, i) => ({
                        name: `Column ${i + 1}`,
                        type: 'text',
                        sampleValues: [],
                        nonEmptyCount: 0,
                        emptyCount: 0
                    }));

                    // Transform to objects for consistency
                    jsonData = jsonData.map((row: any[]) => {
                        const obj: any = {};
                        row.forEach((val, idx) => { obj[`Column ${idx + 1}`] = val; });
                        return obj;
                    });
                } else {
                    // Array of objects
                    const keys = Object.keys(jsonData[0]);
                    cols = keys.map(key => ({
                        name: key,
                        type: 'text',
                        sampleValues: [],
                        nonEmptyCount: 0,
                        emptyCount: 0
                    }));
                }
            }

            setFullData(jsonData);
            setPreviewData(jsonData.slice(0, 5));
            setColumns(cols);

        } catch (error) {
            console.error("Error processing file:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditSource = (source: DataSource) => {
        // To allow header re-selection, we ideally need the original file. 
        // If the file is not persisted (just data), we can only show the data grid but not re-parse.

        // Check if source.file is a genuine File object (not a plain object from JSON)
        const isRealFile = source.file && (source.file instanceof File);

        if (isRealFile) {
            setFile(source.file!);
            // We don't set fullData here immediately because processFile effect will trigger
            setFileFormat(source.type as any); // Type cast
            setHasHeader(true); // Default to true or check if we stored this metadata
            setActiveTab('upload');
            // processFile will run due to useEffect on [file]
        } else {
            // No file available or it's a hydrated plain object
            // Just load data directly and go to upload tab (or refinement)
            console.log("Loading source without original file (hydrated state):", source.name);
            setFile(null); // Ensure file is null so processFile doesn't run with bad object
            setFullData(source.rows || []);
            setColumns(source.columns || []);
            setPreviewData((source.rows || []).slice(0, 5));
            setActiveTab('upload');
            // processFile will NOT run because file is null
        }
        setActiveSourceId(source.id);
        setIsRefining(false); // Go to config screen first
    };

    const handleRefineClick = () => {
        if (fullData.length === 0) return;
        setIsRefining(true);
    };

    const handleSave = (finalData: any[] = fullData, finalColumns: DataColumn[] = columns) => {
        const sourceName = activeSourceId
            ? (savedSources.find(s => s.id === activeSourceId)?.name || 'Untitled Source')
            : (file ? file.name : 'Untitled Source');

        const newSource: DataSource = {
            id: activeSourceId || uuidv4(),
            type: fileFormat,
            name: sourceName,
            status: 'connected',
            rowCount: finalData.length,
            lastUpdated: new Date().toISOString(),
            file: file || undefined,
            columns: finalColumns,
            rows: finalData,
        };

        if (activeSourceId) {
            updateSource(activeSourceId, newSource);
        } else {
            addSource(newSource);
        }

        setActiveSourceId(null);
        setIsRefining(false);
        setFile(null);
        setActiveTab('saved');
    };

    const handleRenameClick = (source: DataSource) => {
        setEditingNameId(source.id);
        setTempName(source.name);
    };

    const handleRenameSave = (id: string) => {
        if (tempName.trim()) updateSource(id, { name: tempName.trim() });
        setEditingNameId(null);
    };

    const handleBulkGenerate = () => {
        // Save the source first
        handleSave();

        // Load data into the active session for bulk generation
        loadData(fullData, columns);

        // Navigate to the generation screen
        navigate('/bulk-generate');
    };

    if (isRefining) {
        return (
            <DataRefinementScreen
                data={fullData}
                columns={columns}
                onSave={handleSave}
                onCancel={() => {
                    setIsRefining(false);
                    // If we were editing, stay on the upload tab to keep context? 
                    // Or go back to saved list? 
                    // User probably expects 'Cancel' to just close the modal overlay.
                }}
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-[#101922] font-sans text-slate-900">
            <div className="w-full max-w-[960px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 h-[90vh]">

                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex-shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {activeSourceId ? 'Edit Data Source' : 'Connect Data Source'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {activeSourceId ? 'Modify configuration or refine data.' : 'Choose a file to populate your design with dynamic content.'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex border-b border-slate-100 dark:border-slate-800 gap-8">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex flex-col items-center justify-center pb-3 transition-all border-b-[3px] ${activeTab === 'upload'
                                ? 'border-blue-500 text-slate-900 dark:text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <span className="text-sm font-semibold">Upload File</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex flex-col items-center justify-center pb-3 transition-all border-b-[3px] ${activeTab === 'saved'
                                ? 'border-blue-500 text-slate-900 dark:text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <span className="text-sm font-semibold">Saved Sources ({savedSources.length})</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 relative custom-scrollbar">

                    {activeTab === 'upload' ? (
                        <>
                            {/* File Upload Area */}
                            <div className="mt-6">
                                {!file && !activeSourceId ? (
                                    <div
                                        {...getRootProps()}
                                        className={`group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed 
                                        ${isDragActive ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'} 
                                        px-6 py-8 transition-all cursor-pointer`}
                                    >
                                        <input {...getInputProps()} />
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <UploadCloud size={24} />
                                            </div>
                                            <div className="text-left space-y-0.5">
                                                <p className="text-slate-900 dark:text-white text-base font-bold">Click or drag file to upload</p>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs">CSV, XLSX, JSON (Max 50MB)</p>
                                            </div>
                                            <button className="ml-4 flex items-center justify-center rounded-full h-8 px-4 bg-blue-600 text-white text-xs font-bold transition-all hover:bg-blue-700 shadow-sm">
                                                Browse
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded text-blue-600 dark:text-blue-300">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{file?.name || (activeSourceId ? 'Current Data Source' : 'Unknown File')}</p>
                                                <p className="text-xs text-slate-500">{fileFormat.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setFile(null); setFullData([]); setActiveSourceId(null); }}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Configuration & Summary Grid */}
                            {(file || activeSourceId) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Configuration */}
                                    <div className="space-y-4">
                                        <h3 className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-2">
                                            <Settings size={20} className="text-blue-500" />
                                            File Configuration
                                        </h3>

                                        <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">File Format</label>
                                                <div className="flex h-11 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800 p-1">
                                                    {(['csv', 'json', 'excel'] as const).map(fmt => (
                                                        <label key={fmt} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 transition-all font-semibold text-sm
                                                            ${fileFormat === fmt
                                                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                            }`}
                                                        >
                                                            <span className="uppercase">{fmt}</span>
                                                            <input
                                                                type="radio"
                                                                value={fmt}
                                                                className="hidden"
                                                                checked={fileFormat === fmt}
                                                                onChange={() => setFileFormat(fmt)}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {fileFormat === 'csv' && (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Delimiter</label>
                                                        <select
                                                            value={delimiter}
                                                            onChange={(e) => setDelimiter(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-10 px-3"
                                                        >
                                                            <option value=",">Comma (,)</option>
                                                            <option value=";">Semicolon (;)</option>
                                                            <option value="\t">Tab (\t)</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {(fileFormat === 'csv' || fileFormat === 'excel') && (
                                                    <div className="flex items-end pb-2 col-span-2">
                                                        <div className="flex items-center gap-6 w-full">
                                                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                                                <div className="relative flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={hasHeader}
                                                                        onChange={(e) => setHasHeader(e.target.checked)}
                                                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                                                                    />
                                                                </div>
                                                                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium group-hover:text-blue-600 transition-colors">Header row</span>
                                                            </label>

                                                            {hasHeader && (
                                                                <div className="flex-1 flex items-center gap-2">
                                                                    <span className="text-xs font-bold uppercase text-slate-400 whitespace-nowrap">Row #</span>
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={headerRowIndex}
                                                                        onChange={(e) => setHeaderRowIndex(Math.max(1, parseInt(e.target.value) || 1))}
                                                                        className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm h-9 px-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Summary */}
                                    <div className="flex flex-col justify-end pb-2">
                                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-6 h-full flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                                    <Database size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Data Summary</p>
                                                    <p className="text-xs text-slate-500">Ready to sync with design</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fullData.length}</p>
                                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-tight">Records Found</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{columns.length}</p>
                                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-tight">Fields Detected</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Data Preview */}
                            {(file || activeSourceId) && (
                                <div className="space-y-4 pb-12">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-2">
                                                <Layout size={20} className="text-blue-500" />
                                                Data Preview
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Info size={14} className="text-slate-400" />
                                                Preview of the first 5 rows. Double-click to edit is available in Refine/Edit mode.
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Sample view
                                        </span>
                                    </div>

                                    <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm border-collapse">
                                                <thead className="bg-blue-50/80 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                                                    <tr>
                                                        <th className="w-12 px-2 py-3 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 font-medium select-none">#</th>
                                                        {columns.map((col, idx) => (
                                                            <th key={idx} className="group relative px-4 py-3 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap border-r border-slate-200/50 dark:border-slate-800 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 cursor-pointer transition-colors">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span>{col.name}</span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {previewData.map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 font-mono">
                                                                {rowIndex + 1}
                                                            </td>
                                                            {columns.map((col, colIndex) => (
                                                                <td key={colIndex} className="px-4 py-3 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                                                                    {String(row[col.name] || '')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Saved Sources UI (Keeping grid layout but matching style where valid) */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            {savedSources.map(source => (
                                <div key={source.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Database size={24} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this data source?')) removeSource(source.id);
                                                }}
                                                className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {editingNameId === source.id ? (
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                autoFocus
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameSave(source.id);
                                                    if (e.key === 'Escape') setEditingNameId(null);
                                                }}
                                                className="flex-1 text-sm font-bold border border-blue-500 rounded px-2 py-1 outline-none dark:bg-slate-900 dark:text-white"
                                            />
                                            <button onClick={() => handleRenameSave(source.id)} className="text-green-600 dark:text-green-400">
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3
                                            className="font-bold text-lg text-slate-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 flex items-center gap-2 group/title"
                                            onClick={() => handleRenameClick(source)}
                                        >
                                            {source.name}
                                            <Edit2 size={12} className="opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                        </h3>
                                    )}

                                    <p className="text-sm text-slate-500 mb-4">{source.rowCount} records • {source.type.toUpperCase()}</p>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => handleEditSource(source)}
                                            className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 size={14} /> Refine
                                        </button>
                                        <button
                                            onClick={() => {
                                                loadData(source.rows || [], source.columns || []);
                                                navigate('/bulk-generate');
                                            }}
                                            className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Layout size={14} /> Generate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions (Sticky at bottom) */}
                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 backdrop-blur-sm">
                    {activeTab === 'upload' && (file || activeSourceId) && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            <Check size={18} />
                            Ready to connect
                        </div>
                    )}
                    <div className="flex items-center gap-6 ml-auto">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        {activeTab === 'upload' && (file || activeSourceId) && (
                            <>
                                <button
                                    onClick={handleRefineClick}
                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                >
                                    Review & Refine
                                </button>
                                <button
                                    onClick={handleBulkGenerate}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mr-2"
                                >
                                    Bulk Generate
                                </button>
                                <button
                                    onClick={() => handleSave()} // Save without refining further
                                    className="flex min-w-[140px] items-center justify-center rounded-full h-11 px-6 bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Connect Data
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataSourcesScreen;
