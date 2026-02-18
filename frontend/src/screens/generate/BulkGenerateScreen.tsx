import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fabric } from 'fabric';
import { useDataStore } from '../../store/dataStore';
import { useTemplateStore, Template } from '../../store/templateStore';
import { useCanvasStore } from '../../store/canvasStore';
import {
    generatePDF,
    generateWord,
    downloadAsZip,
    downloadFile,
    sanitizeFilename,
    getExtension,
    GeneratedFile,
} from '../../utils/exportService';
import './BulkGenerateScreen.css';

// ─── Types ──────────────────────────────────────────────
type OutputFormat = 'pdf' | 'word';
type ExportRange = 'all' | 'current' | 'custom';
type DeliveryMethod = 'download' | 'email' | 'cloud';

// ─── Component ──────────────────────────────────────────
const BulkGenerateScreen: React.FC = () => {
    const navigate = useNavigate();

    // Stores
    const { excelData, mappings, filteredRows, previewRowIndex, setPreviewRow } = useDataStore();
    const { currentTemplate, savedTemplates, loadTemplates, setCurrentTemplate, isLoading: templatesLoading } = useTemplateStore();
    const { canvas, canvasSize } = useCanvasStore();

    // Local state
    const [format, setFormat] = useState<OutputFormat>('pdf');
    const [exportRange, setExportRange] = useState<ExportRange>('all');
    const [customRange, setCustomRange] = useState('');
    const [namingPattern, setNamingPattern] = useState('Invoice_{{last_name}}_{{date}}');
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('download');
    const [searchQuery, setSearchQuery] = useState('');
    const [zoom, setZoom] = useState(90);
    const [showSnapshot, setShowSnapshot] = useState(true);
    const [showVariableDropdown, setShowVariableDropdown] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationComplete, setGenerationComplete] = useState(false);
    const [generatedCount, setGeneratedCount] = useState(0);

    // Preview canvas
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewFabricRef = useRef<fabric.Canvas | null>(null);
    const cancelRef = useRef(false);

    /**
     * Converts Excel serial date (days since 1900) to JS Date
     */
    const excelDateToJSDate = (serial: number): Date => {
        // Excel thinks 1900 was a leap year, so we adjust by 25569 days to reach Unix Epoch (1970)
        // This is a common conversion for modern dates
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        const fractional_day = serial - Math.floor(serial) + 0.0000001;
        let total_seconds = Math.floor(86400 * fractional_day);
        const seconds = total_seconds % 60;
        total_seconds -= seconds;
        const hours = Math.floor(total_seconds / (60 * 60));
        const minutes = Math.floor(total_seconds / 60) % 60;

        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    };

    /**
     * Formats data values for display in placeholders (especially Dates)
     */
    const formatDisplayValue = (value: any): string => {
        if (value === undefined || value === null || value === '') return '';

        let dateObj: Date | null = null;

        // Handle Date objects
        if (value instanceof Date) {
            dateObj = value;
        }
        // Handle numeric strings/numbers that look like Excel dates (e.g. 45292.x)
        else if (typeof value === 'number' || (!isNaN(Number(value)) && String(value).length >= 5)) {
            const num = Number(value);
            // Excel dates for 1980-2050 are roughly 29000 to 55000
            if (num > 25569 && num < 60000) {
                dateObj = excelDateToJSDate(num);
            }
        }
        // Handle ISO date strings
        else if (typeof value === 'string' && value.includes('-') && !isNaN(Date.parse(value))) {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime()) && value.length >= 10) {
                dateObj = parsed;
            }
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        return String(value);
    };

    const totalRows = excelData?.totalRows ?? 0;
    const currentRow = filteredRows[previewRowIndex] || (excelData?.rows?.[previewRowIndex]) || {};
    const columns = excelData?.columns?.map(c => c.name) || [];

    // ─── Initial Check & Template Loading ───
    useEffect(() => {
        if (!currentTemplate && !canvas) {
            loadTemplates();
            setShowTemplateSelector(true);
        } else {
            setShowTemplateSelector(false);
        }
    }, [currentTemplate, canvas, loadTemplates]);

    const handleTemplateSelect = (template: Template) => {
        setCurrentTemplate(template);
        setShowTemplateSelector(false);
    };

    // ─── Preview rendering ──────────────────────────────
    const renderPreview = useCallback(() => {
        if ((!canvas && !currentTemplate?.data) || !previewCanvasRef.current) return;

        const templateJSON = canvas ? canvas.toJSON() : currentTemplate?.data;
        if (!templateJSON) return;

        // Use canvas dimensions or fallback to store size (e.g. A4 default)
        const width = canvas ? canvas.getWidth() : (canvasSize?.width || 794);
        const height = canvas ? canvas.getHeight() : (canvasSize?.height || 1123);

        // Create or reuse fabric canvas for preview
        if (!previewFabricRef.current) {
            previewFabricRef.current = new fabric.Canvas(previewCanvasRef.current!, {
                width: width,
                height: height,
                selection: false,
                interactive: false,
            });
        } else {
            previewFabricRef.current.setWidth(width);
            previewFabricRef.current.setHeight(height);
        }

        const previewCanvas = previewFabricRef.current;
        if (!previewCanvas) return;

        previewCanvas.loadFromJSON(templateJSON, () => {
            // Replace placeholders with data
            previewCanvas.getObjects().forEach((obj: any) => {
                if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                    let text = obj.text || '';
                    const regex = /\{\{([^}]+)\}\}/g;
                    text = text.replace(regex, (_match: string, placeholder: string) => {
                        const columnName = mappings[placeholder] || placeholder;
                        const value = currentRow[columnName];
                        return value !== undefined ? formatDisplayValue(value) : `{{${placeholder}}}`;
                    });
                    obj.set('text', text);
                }
            });
            previewCanvas.renderAll();
        });
    }, [canvas, currentTemplate, mappings, currentRow, canvasSize]);

    useEffect(() => {
        renderPreview();
    }, [renderPreview, previewRowIndex]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (previewFabricRef.current) {
                previewFabricRef.current.dispose();
                previewFabricRef.current = null;
            }
        };
    }, []);

    // ─── Row indices from range ─────────────────────────
    const getRowIndices = useCallback((): number[] => {
        if (exportRange === 'current') return [previewRowIndex];
        if (exportRange === 'custom') return parseCustomRange(customRange, totalRows);
        return Array.from({ length: totalRows }, (_, i) => i);
    }, [exportRange, previewRowIndex, customRange, totalRows]);

    // ─── Generation ─────────────────────────────────────
    const startGeneration = async () => {
        const templateJSON = canvas ? canvas.toJSON() : currentTemplate?.data;
        if ((!canvas && !currentTemplate) || !excelData || generating || !templateJSON) return;

        setGenerating(true);
        setGenerationProgress(0);
        setGenerationComplete(false);
        cancelRef.current = false;

        try {
            const rowIndices = getRowIndices();
            const generatedFiles: GeneratedFile[] = [];
            const width = canvas ? canvas.getWidth() : (canvasSize?.width || 794);
            const height = canvas ? canvas.getHeight() : (canvasSize?.height || 1123);
            const fileNameMap = new Map<string, number>();

            // Ensure fonts are loaded before starting generation to prevent fallback fonts (Serif)
            try {
                // We use Inter as the primary font, but we load a few variants to be safe
                await Promise.all([
                    document.fonts.load('16px Inter'),
                    document.fonts.load('bold 16px Inter'),
                ]);
                await document.fonts.ready;
            } catch (e) {
                console.warn('Font loading wait failed:', e);
            }

            for (let i = 0; i < rowIndices.length; i++) {
                if (cancelRef.current) break;

                const rowIndex = rowIndices[i];
                const row = excelData.rows[rowIndex];
                if (!row) continue;

                setGenerationProgress(Math.round(((i + 1) / rowIndices.length) * 100));

                // Create temp canvas
                const tempEl = document.createElement('canvas');
                tempEl.width = width;
                tempEl.height = height;
                const fabricTemp = new fabric.Canvas(tempEl, { width: width, height: height });

                await new Promise<void>((resolve) => {
                    fabricTemp.loadFromJSON(templateJSON, () => {
                        fabricTemp.getObjects().forEach((obj: any) => {
                            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                                let text = obj.text || '';
                                const regex = /\{\{([^}]+)\}\}/g;
                                text = text.replace(regex, (_match: string, placeholder: string) => {
                                    const columnName = mappings[placeholder] || placeholder;
                                    const value = row[columnName];
                                    return value !== undefined ? formatDisplayValue(value) : `{{${placeholder}}}`;
                                });
                                // Force metrics recalculation by setting dirty and calling setCoords
                                obj.set({
                                    text: text,
                                    dirty: true
                                });
                                obj.setCoords();
                            }
                        });
                        fabricTemp.renderAll();
                        // Give it a tiny bit of time to settle rendering
                        setTimeout(resolve, 50);
                    });
                });

                // Build filename
                let fileName = namingPattern;
                const placeholderRegex = /\{\{([^}]+)\}\}/g;
                fileName = fileName.replace(placeholderRegex, (_match: string, ph: string) => {
                    if (ph === 'date') return new Date().toISOString().split('T')[0];
                    const columnName = mappings[ph] || ph;
                    const value = row[columnName];
                    return value !== undefined ? sanitizeFilename(formatDisplayValue(value)) : ph;
                });
                if (!fileName.trim()) fileName = `Document_${rowIndex + 1}`;

                // Handle duplicate filenames
                let finalFileName = fileName;
                if (fileNameMap.has(fileName)) {
                    const count = fileNameMap.get(fileName)! + 1;
                    fileNameMap.set(fileName, count);
                    finalFileName = `${fileName}_(${count})`;
                } else {
                    fileNameMap.set(fileName, 0);
                }

                // Export as chosen format
                const dataUrl = fabricTemp.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
                let blob: Blob;
                const extension = getExtension(format as any);

                if (format === 'pdf') {
                    blob = await generatePDF(dataUrl, width, height, finalFileName);
                } else {
                    // Word
                    blob = await generateWord(fabricTemp, width, height, finalFileName);
                }

                generatedFiles.push({ name: `${finalFileName}${extension}`, blob });
                fabricTemp.dispose();
            }

            if (cancelRef.current) {
                setGenerating(false);
                return;
            }

            // Download
            if (generatedFiles.length === 1) {
                downloadFile(generatedFiles[0].blob, generatedFiles[0].name);
            } else {
                const batchName = `Batch_${new Date().toISOString().split('T')[0]}`;
                await downloadAsZip(generatedFiles, `${batchName}.zip`);
            }

            setGeneratedCount(generatedFiles.length);
            setGenerationComplete(true);
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Generation failed. Please check the console for details.');
        } finally {
            if (!cancelRef.current) {
                setGenerating(false);
            }
        }
    };

    const handleCancel = () => {
        cancelRef.current = true;
        setGenerating(false);
    };

    // ─── Record navigation ──────────────────────────────
    const goToPrev = () => {
        if (previewRowIndex > 0) setPreviewRow(previewRowIndex - 1);
    };

    const goToNext = () => {
        if (previewRowIndex < totalRows - 1) setPreviewRow(previewRowIndex + 1);
    };

    // ─── Search matching ────────────────────────────────
    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter' || !searchQuery.trim() || !excelData) return;
        const q = searchQuery.toLowerCase();
        const rows = excelData.rows;
        for (let i = 0; i < rows.length; i++) {
            const vals = Object.values(rows[i]).map(v => String(v).toLowerCase());
            if (vals.some(v => v.includes(q))) {
                setPreviewRow(i);
                break;
            }
        }
    };

    // ─── Zoom ───────────────────────────────────────────
    const zoomIn = () => setZoom(z => Math.min(z + 10, 150));
    const zoomOut = () => setZoom(z => Math.max(z - 10, 50));

    // ─── Insert variable ────────────────────────────────
    const insertVariable = (col: string) => {
        setNamingPattern(prev => prev + `{{${col}}}`);
        setShowVariableDropdown(false);
    };

    // ─── Filename example ───────────────────────────────
    const filenameExample = useMemo(() => {
        let result = namingPattern;
        const regex = /\{\{([^}]+)\}\}/g;
        result = result.replace(regex, (_m, ph) => {
            if (ph === 'date') return new Date().toISOString().split('T')[0];
            const columnName = mappings[ph] || ph;
            const value = currentRow[columnName];
            return value !== undefined ? String(value) : ph;
        });
        const ext = format === 'pdf' ? '.pdf' : '.docx';
        return `${result}${ext}`;
    }, [namingPattern, mappings, currentRow, format]);

    // ─── Row count for range ────────────────────────────
    const rangeCount = useMemo(() => {
        if (exportRange === 'all') return totalRows;
        if (exportRange === 'current') return 1;
        return parseCustomRange(customRange, totalRows).length;
    }, [exportRange, customRange, totalRows]);

    // ─── Estimated time ─────────────────────────────────
    const estTime = useMemo(() => {
        const secs = rangeCount * 0.3; // Approx 0.3s per record
        if (secs < 60) return `~${Math.max(1, Math.ceil(secs))} secs`;
        return `~${Math.ceil(secs / 60)} mins`;
    }, [rangeCount]);

    // ─── Data snapshot fields ───────────────────────────
    const snapshotFields = useMemo(() => {
        const fields: { label: string; value: string }[] = [];
        const cols = columns.slice(0, 6);
        cols.forEach(col => {
            fields.push({ label: col, value: currentRow[col] !== undefined ? String(currentRow[col]) : '—' });
        });
        return fields;
    }, [columns, currentRow]);

    // Determine preview dimensions
    const previewWidth = canvas ? canvas.getWidth() : (canvasSize?.width || 794);
    const previewHeight = canvas ? canvas.getHeight() : (canvasSize?.height || 1123);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display h-screen flex overflow-hidden">
            {/* ─── TEMPLATE SELECTOR OVERLAY ─── */}
            {showTemplateSelector && (
                <div className="fixed inset-0 bg-background-light dark:bg-background-dark z-50 flex flex-col p-8 overflow-y-auto">
                    <div className="text-center mb-12 mt-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select a Template</h1>
                        <p className="text-slate-500">Choose a design to use for bulk generation.</p>
                    </div>

                    {templatesLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                            <span className="material-icons animate-spin text-4xl">refresh</span>
                            <p>Loading templates...</p>
                        </div>
                    ) : savedTemplates.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-8 w-full max-w-6xl mx-auto pb-12">
                            {savedTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-primary transition-all duration-300 flex flex-col group"
                                    onClick={() => handleTemplateSelect(template)}
                                >
                                    {template.thumbnail ? (
                                        <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 overflow-hidden border-b border-slate-200 dark:border-slate-700">
                                            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <span className="material-icons text-4xl">image</span>
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="font-semibold text-base mb-1 text-slate-900 dark:text-white truncate">{template.name}</div>
                                        <div className="text-xs text-slate-400">Edited {new Date(template.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 max-w-xl mx-auto">
                            <span className="material-icons text-6xl text-slate-300 mb-6">note_add</span>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No designs found</h3>
                            <p className="text-slate-500 mb-6">Create a design in the editor first.</p>
                            <button
                                className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                onClick={() => navigate('/dashboard')}
                            >
                                <span className="material-icons text-sm">arrow_back</span>
                                Go to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Left Panel: Export Settings */}
            <aside className="w-[420px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-sm">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Export Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Configure how your documents are generated.</p>
                </div>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                    {/* Output Format */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Output Format</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* PDF Card */}
                            <label className="cursor-pointer relative group">
                                <input
                                    type="radio"
                                    name="format"
                                    className="peer sr-only"
                                    checked={format === 'pdf'}
                                    onChange={() => setFormat('pdf')}
                                />
                                <div className="p-4 rounded-xl border-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="material-icons text-primary text-3xl">picture_as_pdf</span>
                                        <span className="material-icons text-primary text-xl opacity-0 peer-checked:opacity-100 transition-opacity">check_circle</span>
                                    </div>
                                    <p className="font-semibold text-slate-900 dark:text-white">PDF Document</p>
                                    <p className="text-xs text-slate-500 mt-1">Best for printing & sharing</p>
                                </div>
                            </label>
                            {/* Word Card */}
                            <label className="cursor-pointer relative group">
                                <input
                                    type="radio"
                                    name="format"
                                    className="peer sr-only"
                                    checked={format === 'word'}
                                    onChange={() => setFormat('word')}
                                />
                                <div className="p-4 rounded-xl border-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="material-icons text-blue-700 text-3xl">description</span>
                                        <span className="material-icons text-primary text-xl opacity-0 peer-checked:opacity-100 transition-opacity">check_circle</span>
                                    </div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Word (.docx)</p>
                                    <p className="text-xs text-slate-500 mt-1">Editable text document</p>
                                </div>
                            </label>
                        </div>
                    </section>
                    {/* Export Range */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Export Range</h3>
                        <div className="space-y-3">
                            <label className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="range"
                                    className="form-radio text-primary border-slate-300 focus:ring-primary h-4 w-4"
                                    checked={exportRange === 'all'}
                                    onChange={() => setExportRange('all')}
                                />
                                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">All records ({totalRows})</span>
                            </label>
                            <label className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="range"
                                    className="form-radio text-primary border-slate-300 focus:ring-primary h-4 w-4"
                                    checked={exportRange === 'current'}
                                    onChange={() => setExportRange('current')}
                                />
                                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">Current preview record</span>
                            </label>
                            <div className="relative">
                                <label className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="range"
                                        className="form-radio text-primary border-slate-300 focus:ring-primary h-4 w-4"
                                        checked={exportRange === 'custom'}
                                        onChange={() => setExportRange('custom')}
                                    />
                                    <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">Custom range</span>
                                </label>
                                {exportRange === 'custom' && (
                                    <input
                                        className="mt-2 ml-10 w-[calc(100%-2.5rem)] text-sm rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-primary py-2 px-3 outline-none border"
                                        placeholder="e.g. 1-50, 55, 60"
                                        type="text"
                                        value={customRange}
                                        onChange={e => setCustomRange(e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                    </section>
                    {/* File Naming */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">File Naming</h3>
                            <button
                                className="text-primary text-xs hover:underline flex items-center font-medium"
                                onClick={() => setShowVariableDropdown(!showVariableDropdown)}
                            >
                                <span className="material-icons text-[14px] mr-1">add_circle_outline</span> Add Variable
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                type="text"
                                value={namingPattern}
                                onChange={e => setNamingPattern(e.target.value)}
                            />
                            {showVariableDropdown && columns.length > 0 && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg max-h-48 overflow-y-auto z-30">
                                    {columns.map(col => (
                                        <div
                                            key={col}
                                            className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                            onClick={() => insertVariable(col)}
                                        >
                                            {`{{${col}}}`}
                                        </div>
                                    ))}
                                    <div
                                        className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                        onClick={() => insertVariable('date')}
                                    >
                                        {'{{date}}'}
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mt-2">Example: {filenameExample}</p>
                        </div>
                    </section>
                    {/* Delivery Options */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Delivery Method</h3>
                        <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-lg flex text-sm font-medium">
                            {(['download', 'email', 'cloud'] as DeliveryMethod[]).map(m => (
                                <button
                                    key={m}
                                    className={`flex-1 py-2 px-3 rounded text-center transition-all ${deliveryMethod === m
                                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    onClick={() => setDeliveryMethod(m)}
                                >
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex gap-3">
                            <span className="material-icons text-primary text-xl mt-0.5">
                                {deliveryMethod === 'download' ? 'folder_zip' : deliveryMethod === 'email' ? 'email' : 'cloud_upload'}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {deliveryMethod === 'download'
                                        ? 'Download as ZIP'
                                        : deliveryMethod === 'email'
                                            ? 'Send via Email'
                                            : 'Upload to Cloud'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {deliveryMethod === 'download'
                                        ? `All ${rangeCount} files will be compressed into a single archive.`
                                        : deliveryMethod === 'email'
                                            ? 'Files will be sent to mapped email addresses.'
                                            : 'Files will be uploaded to your connected cloud storage.'}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <span className="material-icons text-[14px]">schedule</span>
                            Est. time: {estTime}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                            {rangeCount} Files
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button
                            className="flex-[2] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            onClick={startGeneration}
                            disabled={generating || totalRows === 0 || (!canvas && !currentTemplate)}
                        >
                            <span>Generate & Export</span>
                            <span className="material-icons text-xl">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </aside>
            {/* Right Panel: Live Preview */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#0b1219] relative">
                {/* Top Navigation Bar */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons text-slate-400">visibility</span>
                            Live Preview
                        </h2>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        {/* Record Navigation */}
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:shadow-sm transition-all disabled:opacity-30"
                                onClick={goToPrev}
                                disabled={previewRowIndex <= 0}
                            >
                                <span className="material-icons text-lg">chevron_left</span>
                            </button>
                            <span className="px-3 text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">Record {previewRowIndex + 1} of {totalRows}</span>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:shadow-sm transition-all disabled:opacity-30"
                                onClick={goToNext}
                                disabled={previewRowIndex >= totalRows - 1}
                            >
                                <span className="material-icons text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                className="pl-9 pr-4 py-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                placeholder="Search record by name..."
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <div className="flex gap-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all" title="Zoom Out" onClick={zoomOut}>
                                <span className="material-icons text-xl">remove</span>
                            </button>
                            <span className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 w-12 justify-center">{zoom}%</span>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all" title="Zoom In" onClick={zoomIn}>
                                <span className="material-icons text-xl">add</span>
                            </button>
                        </div>
                    </div>
                </header>
                {/* Preview Canvas Area */}
                <div className="flex-1 overflow-auto p-8 flex justify-center items-start relative bg-slate-100 dark:bg-[#0b1219]">
                    {(totalRows > 0 && (canvas || currentTemplate)) ? (
                        <div
                            className="relative bg-white shrink-0 preview-shadow rounded-sm overflow-hidden transform origin-top transition-transform duration-200"
                            style={{
                                width: previewWidth,
                                height: previewHeight,
                                transform: `scale(${zoom / 100})`
                            }}
                        >
                            <canvas ref={previewCanvasRef} />
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-400"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 dark:text-slate-500">
                            <span className="material-icons text-6xl mb-4 opacity-50">insert_drive_file</span>
                            <p className="text-sm">No data / template loaded. Upload data from the editor first to preview documents.</p>
                        </div>
                    )}

                    {/* Data Snapshot Floating Sidebar */}
                    {showSnapshot && totalRows > 0 && snapshotFields.length > 0 && (
                        <div className="absolute right-6 top-6 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-icons text-primary text-sm">data_object</span>
                                    Data Snapshot
                                </h3>
                                <button
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    onClick={() => setShowSnapshot(false)}
                                >
                                    <span className="material-icons text-lg">close</span>
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                {snapshotFields.map((field, idx) => (
                                    <div key={idx} className={`grid grid-cols-3 gap-2 text-sm ${idx > 0 ? 'border-t border-slate-100 dark:border-slate-700 pt-2' : ''}`}>
                                        <div className="text-slate-500 dark:text-slate-400 truncate">{field.label}</div>
                                        <div className="col-span-2 font-medium text-slate-900 dark:text-white text-right truncate">{field.value}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-t border-blue-100 dark:border-blue-800">
                                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                    <span className="material-icons text-[14px]">info</span>
                                    Displaying row {previewRowIndex + 1} from data
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── PROGRESS OVERLAY ─── */}
            {generating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in text-slate-800 dark:text-white">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 min-w-[440px] text-center shadow-2xl relative border border-slate-200 dark:border-slate-700">
                        <button
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            onClick={handleCancel}
                        >
                            <span className="material-icons">close</span>
                        </button>

                        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6 text-indigo-600">
                            <span className="material-icons animate-spin text-3xl">sync</span>
                        </div>

                        <h3 className="text-2xl font-bold mb-2">Generating Documents</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">Please wait while we process your documents. Do not close this tab.</p>

                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4 border border-slate-200 dark:border-slate-600">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-[width] duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                                style={{ width: `${generationProgress}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-sm font-medium text-slate-400">Progress</span>
                            <span className="font-bold text-indigo-600 text-lg tabular-nums">{generationProgress}%</span>
                        </div>

                        <button
                            onClick={handleCancel}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="material-icons text-lg group-hover:rotate-90 transition-transform">close</span>
                            Cancel Progress
                        </button>
                    </div>
                </div>
            )}

            {/* ─── SUCCESS OVERLAY ─── */}
            {generationComplete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-12 min-w-[420px] text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4 text-green-600">
                            <span className="material-icons text-3xl">check</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generation Complete!</h3>
                        <p className="text-slate-500 mb-6">Successfully created {generatedCount} file{generatedCount !== 1 ? 's' : ''}.</p>
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full shadow-md"
                            onClick={() => setGenerationComplete(false)}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Helpers ────────────────────────────────────────────
function parseCustomRange(input: string, max: number): number[] {
    if (!input.trim()) return [];
    const indices = new Set<number>();
    const parts = input.split(',').map(s => s.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-').map(s => s.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.max(1, start); i <= Math.min(end, max); i++) {
                    indices.add(i - 1); // Convert to 0-based
                }
            }
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num) && num >= 1 && num <= max) {
                indices.add(num - 1);
            }
        }
    }

    return Array.from(indices).sort((a, b) => a - b);
}

export default BulkGenerateScreen;
