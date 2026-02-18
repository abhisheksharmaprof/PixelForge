import React, { useState, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { useDataSourceStore } from '../../store/dataSourceStore';
import { DataSource } from '../../types/mailMergeTypes';
import {
    X, Upload, FileSpreadsheet, Globe, Clock, CheckCircle2, AlertCircle,
    FileJson, Table, ChevronDown, Database, Trash2
} from 'lucide-react';

type TabId = 'upload' | 'api' | 'recent';

export const DataSourceModal: React.FC = () => {
    const { activeModal, closeModal, addNotification } = useUIStore();
    const { connectCSV, connectJSON, loadDataSource, isConnecting, dataSource } = useMailMergeStore();
    const { savedSources, removeSource } = useDataSourceStore();
    const [activeTab, setActiveTab] = useState<TabId>('upload');
    const [selectedFileType, setSelectedFileType] = useState<'csv' | 'json' | 'excel'>('csv');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [firstRowHeader, setFirstRowHeader] = useState(true);
    const [delimiter, setDelimiter] = useState(',');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (activeModal !== 'dataSourceConnection') return null;

    const handleConnectSaved = (source: DataSource) => {
        try {
            loadDataSource(source);
            addNotification({
                type: 'success',
                title: 'Data Source Loaded',
                message: `Successfully loaded "${source.name}"`,
                duration: 3000,
                autoClose: true,
            });
            closeModal();
        } catch (err: any) {
            setError(err.message || 'Failed to load source');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFileSelect(dropped);
    };

    const handleFileSelect = async (selected: File) => {
        setFile(selected);
        setError(null);
        try {
            const text = await selected.text();
            if (selected.name.endsWith('.json')) {
                setSelectedFileType('json');
                const parsed = JSON.parse(text);
                const records = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [];
                if (records.length === 0) throw new Error('No records found');
                const keys = Object.keys(records[0]);
                const rows = records.slice(0, 5).map((r: any) => keys.map(k => String(r[k] ?? '')));
                setPreviewData({ headers: keys, rows });
            } else {
                setSelectedFileType('csv');
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1, 6).map(l =>
                    l.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
                );
                setPreviewData({ headers, rows });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to parse file');
            setPreviewData(null);
        }
    };

    const handleConnect = async () => {
        if (!file) return;
        try {
            if (selectedFileType === 'json') {
                await connectJSON(file);
            } else {
                await connectCSV(file);
            }
            addNotification({
                type: 'success',
                title: 'Data Source Connected',
                message: `Successfully connected "${file.name}"`,
                duration: 3000,
                autoClose: true,
            });
            closeModal();
        } catch (err: any) {
            setError(err.message || 'Failed to connect');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={closeModal}>
            <div
                className="bg-white rounded-xl shadow-2xl w-[680px] max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Connect Data Source</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Select a data source to personalize your template</p>
                    </div>
                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                    {[
                        { id: 'upload' as TabId, label: 'Upload File', icon: <Upload size={14} /> },
                        { id: 'api' as TabId, label: 'Connect API', icon: <Globe size={14} /> },
                        { id: 'recent' as TabId, label: 'Recent Sources', icon: <Clock size={14} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === tab.id
                                ? 'text-blue-600 border-blue-600'
                                : 'text-slate-500 border-transparent hover:text-slate-700'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'upload' && (
                        <>
                            {/* Drop Zone */}
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer mb-4"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={36} className="mx-auto mb-3 text-slate-400" />
                                <p className="text-sm font-medium text-slate-600">
                                    Drag CSV or JSON file here
                                </p>
                                <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                                <p className="text-xs text-slate-400 mt-0.5">Maximum 50MB</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.json,.tsv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileSelect(f);
                                    }}
                                />
                            </div>

                            {/* File type + options */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600">Type:</span>
                                    {(['csv', 'json'] as const).map(ft => (
                                        <label key={ft} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fileType"
                                                checked={selectedFileType === ft}
                                                onChange={() => setSelectedFileType(ft)}
                                                className="accent-blue-500"
                                            />
                                            {ft.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                                {selectedFileType === 'csv' && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Delimiter:</span>
                                            <select
                                                value={delimiter}
                                                onChange={(e) => setDelimiter(e.target.value)}
                                                className="text-xs border border-slate-200 rounded px-2 py-1"
                                            >
                                                <option value=",">Comma</option>
                                                <option value="\t">Tab</option>
                                                <option value=";">Semicolon</option>
                                                <option value="|">Pipe</option>
                                            </select>
                                        </div>
                                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={firstRowHeader}
                                                onChange={(e) => setFirstRowHeader(e.target.checked)}
                                                className="accent-blue-500"
                                            />
                                            First row as header
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* File selected indicator */}
                            {file && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                    <FileSpreadsheet size={16} className="text-blue-500" />
                                    <span className="text-sm font-medium text-blue-700 flex-1">{file.name}</span>
                                    <span className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB</span>
                                    <button onClick={() => { setFile(null); setPreviewData(null); }} className="text-blue-400 hover:text-blue-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Preview Table */}
                            {previewData && (
                                <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-600">Data Preview</span>
                                        <span className="text-xs text-slate-400">Showing first 5 rows</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    {previewData.headers.map((h, i) => (
                                                        <th key={i} className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.rows.map((row, ri) => (
                                                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                        {row.map((cell, ci) => (
                                                            <td key={ci} className="px-3 py-1.5 text-slate-600 border-b border-slate-100 whitespace-nowrap max-w-[150px] truncate">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            {previewData && !error && (
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 size={14} /> Ready to connect
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-500">{previewData.headers.length} fields identified</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'api' && (
                        <div className="text-center py-12 text-slate-400">
                            <Globe size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">API connection coming soon</p>
                            <p className="text-xs mt-1">Connect to REST APIs, Google Sheets, and more</p>
                        </div>
                    )}

                    {activeTab === 'recent' && (
                        <div className="space-y-4">
                            {savedSources.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Clock size={40} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">No saved sources</p>
                                    <p className="text-xs mt-1">Connect a source in the Data Sources page to save it here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {savedSources.map(source => (
                                        <div
                                            key={source.id}
                                            className="flex items-center p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                                            onClick={() => handleConnectSaved(source)}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                                                <Database size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-slate-800">{source.name}</h4>
                                                <p className="text-xs text-slate-500">
                                                    {source.rowCount} records • {source.type.toUpperCase()} • {new Date(source.lastUpdated).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Remove this saved source?')) removeSource(source.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConnect}
                        disabled={!file || !!error || isConnecting}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};
