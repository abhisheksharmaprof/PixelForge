import { create } from 'zustand';
import {
    DataSource, DataColumn, MailMergeField, TemplateVariable,
    ConditionalRule, Condition, DataFilter, DataSort, FilterPreset,
    GenerationConfig, GenerationProgress, ValidationIssue,
    FieldType, ConnectionStatus, LogicOperator, GenerationStatus,
    FilterOperator
} from '../types/mailMergeTypes';
import { useCanvasStore } from './canvasStore';
import { BatchGenerator } from '../utils/batchGenerator';

let activeGenerator: BatchGenerator | null = null;

// ─── Helper: detect field type from sample values ────────

function detectFieldType(values: any[]): FieldType {
    const samples = values.filter(v => v !== null && v !== undefined && v !== '');
    if (samples.length === 0) return 'text';
    const allBool = samples.every(v => typeof v === 'boolean' || v === 'true' || v === 'false');
    if (allBool) return 'boolean';
    const allNumber = samples.every(v => !isNaN(Number(v)) && v !== '');
    if (allNumber) return 'number';
    const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
    const allDate = samples.every(v => dateRegex.test(String(v)));
    if (allDate) return 'date';
    const allUrl = samples.every(v => /\.(jpg|jpeg|png|gif|webp|svg)/i.test(String(v)) || /^https?:\/\//i.test(String(v)));
    if (allUrl) return 'image';
    const allArray = samples.every(v => Array.isArray(v));
    if (allArray) return 'array';
    return 'text';
}

function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Store Interface ─────────────────────────────────────

interface MailMergeState {
    // Data Source
    dataSource: DataSource | null;
    isConnecting: boolean;

    // Fields & Variables
    fields: MailMergeField[];
    templateVariables: TemplateVariable[];
    fieldSearchQuery: string;
    fieldTypeFilter: FieldType | 'all';

    // Conditions
    conditionalRules: ConditionalRule[];

    // Filters & Sorting
    activeFilters: DataFilter[];
    activeSorts: DataSort[];
    filterPresets: FilterPreset[];
    filteredRows: Record<string, any>[];

    // Preview
    previewRecordIndex: number;
    isPreviewMode: boolean;
    viewSettings: {
        showGuides: boolean;
        showFieldHighlights: boolean;
    };

    // Generation
    generationConfig: GenerationConfig;
    generationProgress: GenerationProgress;

    // Validation
    validationIssues: ValidationIssue[];

    // ── Data Source Actions ──
    connectCSV: (file: File) => Promise<void>;
    connectJSON: (file: File) => Promise<void>;
    loadDataSource: (dataSource: DataSource) => void;
    disconnectDataSource: () => void;
    refreshDataSource: () => Promise<void>;
    setDataSourceStatus: (status: ConnectionStatus) => void;

    // ── View Actions ──
    toggleViewSetting: (setting: 'showGuides' | 'showFieldHighlights') => void;

    // ── Field Actions ──
    setFieldSearchQuery: (query: string) => void;
    setFieldTypeFilter: (filter: FieldType | 'all') => void;
    toggleFieldFavorite: (fieldId: string) => void;
    updateField: (fieldId: string, updates: Partial<MailMergeField>) => void;
    incrementFieldUsage: (fieldName: string) => void;
    getFilteredFields: () => MailMergeField[];

    // ── Template Variable Actions ──
    addTemplateVariable: (name: string, type: FieldType, defaultValue: string) => void;
    updateTemplateVariable: (id: string, updates: Partial<TemplateVariable>) => void;
    deleteTemplateVariable: (id: string) => void;

    // ── Conditional Rule Actions ──
    addConditionalRule: (rule: Omit<ConditionalRule, 'id'>) => void;
    updateConditionalRule: (id: string, updates: Partial<ConditionalRule>) => void;
    deleteConditionalRule: (id: string) => void;
    toggleConditionalRule: (id: string) => void;
    evaluateCondition: (rule: ConditionalRule, record: Record<string, any>) => boolean;

    // ── Filter & Sort Actions ──
    addFilter: (filter: Omit<DataFilter, 'id'>) => void;
    updateFilter: (id: string, updates: Partial<DataFilter>) => void;
    removeFilter: (id: string) => void;
    clearAllFilters: () => void;
    addSort: (sort: Omit<DataSort, 'id'>) => void;
    updateSort: (id: string, updates: Partial<DataSort>) => void;
    removeSort: (id: string) => void;
    clearAllSorts: () => void;
    applyFiltersAndSorts: () => void;
    saveFilterPreset: (name: string) => void;
    loadFilterPreset: (presetId: string) => void;
    deleteFilterPreset: (presetId: string) => void;

    // ── Preview Actions ──
    setPreviewRecordIndex: (index: number) => void;
    nextRecord: () => void;
    prevRecord: () => void;
    firstRecord: () => void;
    lastRecord: () => void;
    randomRecord: () => void;
    togglePreviewMode: () => void;
    getCurrentRecord: () => Record<string, any> | null;

    // ── Generation Actions ──
    updateGenerationConfig: (config: Partial<GenerationConfig>) => void;
    startGeneration: () => Promise<void>;
    pauseGeneration: () => void;
    resumeGeneration: () => void;
    cancelGeneration: () => void;
    updateGenerationProgress: (progress: Partial<GenerationProgress>) => void;

    // ── Validation Actions ──
    runValidation: () => ValidationIssue[];
    clearValidation: () => void;
}

// ─── Default System Variables ────────────────────────────

const defaultSystemVariables: TemplateVariable[] = [
    { id: 'sys_doc_title', name: '{{document_title}}', type: 'text', defaultValue: 'Untitled', isSystem: true, usageCount: 0 },
    { id: 'sys_page_number', name: '{{page_number}}', type: 'number', defaultValue: '1', isSystem: true, usageCount: 0 },
    { id: 'sys_total_pages', name: '{{total_pages}}', type: 'number', defaultValue: '1', isSystem: true, usageCount: 0 },
    { id: 'sys_timestamp', name: '{{timestamp}}', type: 'date', defaultValue: new Date().toISOString(), isSystem: true, usageCount: 0 },
    { id: 'sys_filename', name: '{{filename}}', type: 'text', defaultValue: 'output', isSystem: true, usageCount: 0 },
    { id: 'sys_generation_id', name: '{{generation_id}}', type: 'text', defaultValue: '', isSystem: true, usageCount: 0 },
];

const defaultGenerationConfig: GenerationConfig = {
    recordSelection: 'all',
    format: 'pdf',
    resolution: 300,
    quality: 90,
    filenamePattern: '{first_name}_{id}',
    outputMode: 'separate',
    includeMetadata: false,
    createArchive: true,
};

const defaultGenerationProgress: GenerationProgress = {
    status: 'idle',
    currentRecord: 0,
    totalRecords: 0,
    percentage: 0,
    elapsedTime: 0,
    estimatedRemaining: 0,
    speed: 0,
    successCount: 0,
    errorCount: 0,
    warningCount: 0,
    errors: [],
    generatedFiles: [],
};

// ─── Store Implementation ────────────────────────────────

export const useMailMergeStore = create<MailMergeState>((set, get) => ({
    // ── Initial State ──
    dataSource: null,
    isConnecting: false,
    fields: [],
    templateVariables: [...defaultSystemVariables],
    fieldSearchQuery: '',
    fieldTypeFilter: 'all',
    conditionalRules: [],
    activeFilters: [],
    activeSorts: [],
    filterPresets: [],
    filteredRows: [],
    previewRecordIndex: 0,
    isPreviewMode: false,
    viewSettings: {
        showGuides: true,
        showFieldHighlights: true,
    },
    generationConfig: { ...defaultGenerationConfig },
    generationProgress: { ...defaultGenerationProgress },
    validationIssues: [],

    // ── Data Source Actions ──────────────────────────────

    connectCSV: async (file) => {
        set({ isConnecting: true });
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows: Record<string, any>[] = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row: Record<string, any> = {};
                headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
                rows.push(row);
            }

            // Detect column types from sample values
            const columns: DataColumn[] = headers.map(h => {
                const samples = rows.slice(0, 20).map(r => r[h]).filter(v => v !== '' && v !== undefined);
                return {
                    name: h,
                    type: detectFieldType(samples),
                    sampleValues: samples.slice(0, 5).map(String),
                    nonEmptyCount: rows.filter(r => r[h] !== '' && r[h] !== undefined).length,
                    emptyCount: rows.filter(r => !r[h] || r[h] === '').length,
                };
            });

            const fields: MailMergeField[] = columns.map((col, idx) => ({
                id: `field_${idx}_${col.name}`,
                name: col.name,
                displayLabel: col.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                type: col.type,
                usageCount: 0,
                isFavorite: false,
                sampleValues: col.sampleValues,
                description: '',
                defaultValue: '',
                textTransform: 'none' as const,
                overflowBehavior: 'truncate' as const,
                imageFit: 'fill' as const,
            }));

            const ds: DataSource = {
                id: generateId(),
                type: 'csv',
                name: file.name,
                status: 'connected',
                rowCount: rows.length,
                lastUpdated: new Date().toISOString(),
                file,
                columns,
                rows,
            };

            set({
                dataSource: ds,
                fields,
                filteredRows: rows,
                isConnecting: false,
                previewRecordIndex: 0,
            });
        } catch (error) {
            console.error('CSV parse error:', error);
            set({ isConnecting: false });
            throw error;
        }
    },

    connectJSON: async (file) => {
        set({ isConnecting: true });
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            let records: Record<string, any>[] = [];
            if (Array.isArray(parsed)) {
                records = parsed;
            } else if (parsed.data && Array.isArray(parsed.data)) {
                records = parsed.data;
            } else if (parsed.records && Array.isArray(parsed.records)) {
                records = parsed.records;
            } else {
                throw new Error('JSON must contain an array of records');
            }

            if (records.length === 0) throw new Error('No records found in JSON');

            const allKeys = new Set<string>();
            records.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
            const headers = Array.from(allKeys);

            const columns: DataColumn[] = headers.map(h => {
                const samples = records.slice(0, 20).map(r => r[h]).filter(v => v !== null && v !== undefined && v !== '');
                return {
                    name: h,
                    type: detectFieldType(samples),
                    sampleValues: samples.slice(0, 5).map(String),
                    nonEmptyCount: records.filter(r => r[h] !== null && r[h] !== undefined && r[h] !== '').length,
                    emptyCount: records.filter(r => !r[h] || r[h] === '').length,
                };
            });

            const fields: MailMergeField[] = columns.map((col, idx) => ({
                id: `field_${idx}_${col.name}`,
                name: col.name,
                displayLabel: col.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                type: col.type,
                usageCount: 0,
                isFavorite: false,
                sampleValues: col.sampleValues,
            }));

            const ds: DataSource = {
                id: generateId(),
                type: 'json',
                name: file.name,
                status: 'connected',
                rowCount: records.length,
                lastUpdated: new Date().toISOString(),
                file,
                columns,
                rows: records,
            };

            set({
                dataSource: ds,
                fields,
                filteredRows: records,
                isConnecting: false,
                previewRecordIndex: 0,
            });
        } catch (error) {
            console.error('JSON parse error:', error);
            set({ isConnecting: false });
            throw error;
        }
    },

    loadDataSource: (dataSource: DataSource) => {
        // Generate fields from columns definition
        const fields: MailMergeField[] = dataSource.columns.map((col, idx) => ({
            id: `field_${idx}_${col.name}`,
            name: col.name,
            displayLabel: col.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            type: col.type,
            usageCount: 0,
            isFavorite: false,
            sampleValues: col.sampleValues,
            description: '',
            defaultValue: '',
            textTransform: 'none' as const,
            overflowBehavior: 'truncate' as const,
            imageFit: 'fill' as const,
        }));

        set({
            dataSource: { ...dataSource, status: 'connected' },
            fields,
            filteredRows: dataSource.rows,
            isConnecting: false,
            previewRecordIndex: 0,
            activeFilters: [],
            activeSorts: [],
        });
    },

    disconnectDataSource: () => set({
        dataSource: null,
        fields: [],
        activeFilters: [],
        activeSorts: [],
        filteredRows: [],
        previewRecordIndex: 0,
        isPreviewMode: false
    }),

    refreshDataSource: async () => {
        // Mock refresh
        console.log('Refreshing data source...');
        set(state => ({
            dataSource: state.dataSource ? { ...state.dataSource, status: 'refreshing' as ConnectionStatus } : null
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        set(state => ({
            dataSource: state.dataSource ? { ...state.dataSource, status: 'connected' as ConnectionStatus } : null
        }));
    },

    setDataSourceStatus: (status: ConnectionStatus) => {
        set(state => ({
            dataSource: state.dataSource ? { ...state.dataSource, status } : null,
        }));
    },

    toggleViewSetting: (setting) => set(state => ({
        viewSettings: {
            ...state.viewSettings,
            [setting]: !state.viewSettings[setting]
        }
    })),

    // ── Field Actions ────────────────────────────────────

    setFieldSearchQuery: (query) => set({ fieldSearchQuery: query }),
    setFieldTypeFilter: (filter) => set({ fieldTypeFilter: filter }),

    toggleFieldFavorite: (fieldId) => {
        set(state => ({
            fields: state.fields.map(f =>
                f.id === fieldId ? { ...f, isFavorite: !f.isFavorite } : f
            ),
        }));
    },

    updateField: (fieldId, updates) => {
        set(state => ({
            fields: state.fields.map(f =>
                f.id === fieldId ? { ...f, ...updates } : f
            ),
        }));
    },

    incrementFieldUsage: (fieldName) => {
        set(state => ({
            fields: state.fields.map(f =>
                f.name === fieldName ? { ...f, usageCount: f.usageCount + 1 } : f
            ),
        }));
    },

    getFilteredFields: () => {
        const { fields, fieldSearchQuery, fieldTypeFilter } = get();
        let result = [...fields];
        if (fieldTypeFilter !== 'all') {
            result = result.filter(f => f.type === fieldTypeFilter);
        }
        if (fieldSearchQuery) {
            const q = fieldSearchQuery.toLowerCase();
            result = result.filter(f =>
                f.name.toLowerCase().includes(q) || f.displayLabel.toLowerCase().includes(q)
            );
        }
        // Sort: favorites first, then by usage count
        result.sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return b.usageCount - a.usageCount;
        });
        return result;
    },

    // ── Template Variable Actions ────────────────────────

    addTemplateVariable: (name, type, defaultValue) => {
        const variable: TemplateVariable = {
            id: generateId(),
            name: `{{${name}}}`,
            type,
            defaultValue,
            isSystem: false,
            usageCount: 0,
        };
        set(state => ({
            templateVariables: [...state.templateVariables, variable],
        }));
    },

    updateTemplateVariable: (id, updates) => {
        set(state => ({
            templateVariables: state.templateVariables.map(v =>
                v.id === id ? { ...v, ...updates } : v
            ),
        }));
    },

    deleteTemplateVariable: (id) => {
        set(state => ({
            templateVariables: state.templateVariables.filter(v => v.id !== id || v.isSystem),
        }));
    },

    // ── Conditional Rule Actions ─────────────────────────

    addConditionalRule: (rule) => {
        const newRule: ConditionalRule = { ...rule, id: generateId() };
        set(state => ({
            conditionalRules: [...state.conditionalRules, newRule],
        }));
    },

    updateConditionalRule: (id, updates) => {
        set(state => ({
            conditionalRules: state.conditionalRules.map(r =>
                r.id === id ? { ...r, ...updates } : r
            ),
        }));
    },

    deleteConditionalRule: (id) => {
        set(state => ({
            conditionalRules: state.conditionalRules.filter(r => r.id !== id),
        }));
    },

    toggleConditionalRule: (id) => {
        set(state => ({
            conditionalRules: state.conditionalRules.map(r =>
                r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
            ),
        }));
    },

    evaluateCondition: (rule, record) => {
        if (!rule.isEnabled) return true;
        const evalSingle = (condition: Condition): boolean => {
            const val = String(record[condition.field] ?? '');
            const cmpVal = condition.value;
            switch (condition.operator) {
                case 'equals': return val === cmpVal;
                case 'notEquals': return val !== cmpVal;
                case 'contains': return val.toLowerCase().includes(cmpVal.toLowerCase());
                case 'notContains': return !val.toLowerCase().includes(cmpVal.toLowerCase());
                case 'startsWith': return val.toLowerCase().startsWith(cmpVal.toLowerCase());
                case 'endsWith': return val.toLowerCase().endsWith(cmpVal.toLowerCase());
                case 'isEmpty': return val === '';
                case 'isNotEmpty': return val !== '';
                case 'greaterThan': return Number(val) > Number(cmpVal);
                case 'lessThan': return Number(val) < Number(cmpVal);
                case 'greaterOrEqual': return Number(val) >= Number(cmpVal);
                case 'lessOrEqual': return Number(val) <= Number(cmpVal);
                case 'between': return Number(val) >= Number(cmpVal) && Number(val) <= Number(condition.secondValue || cmpVal);
                case 'isTrue': return val === 'true' || val === '1';
                case 'isFalse': return val === 'false' || val === '0';
                case 'before': return new Date(val) < new Date(cmpVal);
                case 'after': return new Date(val) > new Date(cmpVal);
                case 'isToday': { const today = new Date().toISOString().split('T')[0]; return val.startsWith(today); }
                default: return true;
            }
        };
        if (rule.conditions.length === 0) return true;
        if (rule.logicOperator === 'AND') {
            return rule.conditions.every(evalSingle);
        }
        return rule.conditions.some(evalSingle);
    },

    // ── Filter & Sort Actions ────────────────────────────

    addFilter: (filter) => {
        const newFilter: DataFilter = { ...filter, id: generateId() };
        set(state => {
            const newFilters = [...state.activeFilters, newFilter];
            return { activeFilters: newFilters };
        });
        get().applyFiltersAndSorts();
    },

    updateFilter: (id, updates) => {
        set(state => ({
            activeFilters: state.activeFilters.map(f =>
                f.id === id ? { ...f, ...updates } : f
            ),
        }));
        get().applyFiltersAndSorts();
    },

    removeFilter: (id) => {
        set(state => ({
            activeFilters: state.activeFilters.filter(f => f.id !== id),
        }));
        get().applyFiltersAndSorts();
    },

    clearAllFilters: () => {
        set({ activeFilters: [] });
        get().applyFiltersAndSorts();
    },

    addSort: (sort) => {
        const newSort: DataSort = { ...sort, id: generateId() };
        set(state => ({
            activeSorts: [...state.activeSorts, newSort],
        }));
        get().applyFiltersAndSorts();
    },

    updateSort: (id, updates) => {
        set(state => ({
            activeSorts: state.activeSorts.map(s =>
                s.id === id ? { ...s, ...updates } : s
            ),
        }));
        get().applyFiltersAndSorts();
    },

    removeSort: (id) => {
        set(state => ({
            activeSorts: state.activeSorts.filter(s => s.id !== id),
        }));
        get().applyFiltersAndSorts();
    },

    clearAllSorts: () => {
        set({ activeSorts: [] });
        get().applyFiltersAndSorts();
    },

    applyFiltersAndSorts: () => {
        const { dataSource, activeFilters, activeSorts } = get();
        if (!dataSource) { set({ filteredRows: [] }); return; }

        let rows = [...dataSource.rows];

        // Apply filters
        if (activeFilters.length > 0) {
            rows = rows.filter(row => {
                let result = true;
                for (let i = 0; i < activeFilters.length; i++) {
                    const f = activeFilters[i];
                    const val = String(row[f.field] ?? '').toLowerCase();
                    const cmpVal = f.value.toLowerCase();
                    let matches = false;
                    switch (f.operator) {
                        case 'equals': matches = val === cmpVal; break;
                        case 'notEquals': matches = val !== cmpVal; break;
                        case 'contains': matches = val.includes(cmpVal); break;
                        case 'notContains': matches = !val.includes(cmpVal); break;
                        case 'startsWith': matches = val.startsWith(cmpVal); break;
                        case 'endsWith': matches = val.endsWith(cmpVal); break;
                        case 'isEmpty': matches = val === ''; break;
                        case 'isNotEmpty': matches = val !== ''; break;
                        case 'greaterThan': matches = Number(row[f.field]) > Number(f.value); break;
                        case 'lessThan': matches = Number(row[f.field]) < Number(f.value); break;
                        case 'greaterOrEqual': matches = Number(row[f.field]) >= Number(f.value); break;
                        case 'lessOrEqual': matches = Number(row[f.field]) <= Number(f.value); break;
                        case 'between': matches = Number(row[f.field]) >= Number(f.value) && Number(row[f.field]) <= Number(f.secondValue || f.value); break;
                        case 'isTrue': matches = val === 'true' || val === '1'; break;
                        case 'isFalse': matches = val === 'false' || val === '0'; break;
                        case 'before': matches = new Date(row[f.field]) < new Date(f.value); break;
                        case 'after': matches = new Date(row[f.field]) > new Date(f.value); break;
                        case 'isToday': { const t = new Date().toISOString().split('T')[0]; matches = String(row[f.field]).startsWith(t); break; }
                        case 'matchesRegex': try { matches = new RegExp(f.value).test(String(row[f.field])); } catch { matches = false; } break;
                        default: matches = true; break;
                    }
                    if (i === 0) {
                        result = matches;
                    } else {
                        if (activeFilters[i - 1].logicOperator === 'AND') {
                            result = result && matches;
                        } else {
                            result = result || matches;
                        }
                    }
                }
                return result;
            });
        }

        // Apply sorts
        if (activeSorts.length > 0) {
            const sortedSorts = [...activeSorts].sort((a, b) => a.priority - b.priority);
            rows.sort((a, b) => {
                for (const s of sortedSorts) {
                    const valA = a[s.field];
                    const valB = b[s.field];
                    let cmp = 0;
                    if (typeof valA === 'number' && typeof valB === 'number') {
                        cmp = valA - valB;
                    } else {
                        cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
                    }
                    if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
                }
                return 0;
            });
        }

        set({ filteredRows: rows, previewRecordIndex: 0 });
    },

    saveFilterPreset: (name) => {
        const { activeFilters, activeSorts } = get();
        const preset: FilterPreset = {
            id: generateId(),
            name,
            filters: [...activeFilters],
            sorts: [...activeSorts],
            createdAt: new Date().toISOString(),
        };
        set(state => ({
            filterPresets: [...state.filterPresets, preset],
        }));
    },

    loadFilterPreset: (presetId) => {
        const preset = get().filterPresets.find(p => p.id === presetId);
        if (!preset) return;
        set({
            activeFilters: [...preset.filters],
            activeSorts: [...preset.sorts],
        });
        get().applyFiltersAndSorts();
    },

    deleteFilterPreset: (presetId) => {
        set(state => ({
            filterPresets: state.filterPresets.filter(p => p.id !== presetId),
        }));
    },

    // ── Preview Actions ──────────────────────────────────

    setPreviewRecordIndex: (index) => {
        const { filteredRows } = get();
        if (index >= 0 && index < filteredRows.length) {
            set({ previewRecordIndex: index });
        }
    },

    nextRecord: () => {
        const { previewRecordIndex, filteredRows } = get();
        if (previewRecordIndex < filteredRows.length - 1) {
            set({ previewRecordIndex: previewRecordIndex + 1 });
        }
    },

    prevRecord: () => {
        const { previewRecordIndex } = get();
        if (previewRecordIndex > 0) {
            set({ previewRecordIndex: previewRecordIndex - 1 });
        }
    },

    firstRecord: () => set({ previewRecordIndex: 0 }),

    lastRecord: () => {
        const { filteredRows } = get();
        set({ previewRecordIndex: Math.max(0, filteredRows.length - 1) });
    },

    randomRecord: () => {
        const { filteredRows } = get();
        if (filteredRows.length > 0) {
            set({ previewRecordIndex: Math.floor(Math.random() * filteredRows.length) });
        }
    },

    togglePreviewMode: () => set(state => ({ isPreviewMode: !state.isPreviewMode })),

    getCurrentRecord: () => {
        const { filteredRows, previewRecordIndex } = get();
        return filteredRows[previewRecordIndex] || null;
    },

    // ── Generation Actions ───────────────────────────────

    updateGenerationConfig: (config) => {
        set(state => ({
            generationConfig: { ...state.generationConfig, ...config },
        }));
    },

    startGeneration: async () => {
        const { dataSource, filteredRows, conditionalRules, generationConfig } = get();
        const canvas = useCanvasStore.getState().canvas;

        if (!dataSource || !canvas) {
            console.error('Missing data source or canvas');
            return;
        }

        set({
            generationProgress: {
                ...defaultGenerationProgress,
                status: 'generating',
                totalRecords: filteredRows.length,
            },
        });

        const templateJson = canvas.toJSON(['id', 'elementType', 'fieldBinding', 'isMailMerge']);

        activeGenerator = new BatchGenerator(
            canvas,
            templateJson,
            filteredRows,
            conditionalRules,
            generationConfig,
            (progress) => {
                set({ generationProgress: progress });
            }
        );

        try {
            await activeGenerator.process();
        } catch (error) {
            console.error('Generation failed:', error);
            set(state => ({
                generationProgress: {
                    ...state.generationProgress,
                    status: 'error',
                    // errors: [...state.generationProgress.errors, { message: String(error) }] 
                }
            }));
        } finally {
            activeGenerator = null;
        }
    },

    pauseGeneration: () => {
        set(state => ({
            generationProgress: { ...state.generationProgress, status: 'paused' },
        }));
    },

    resumeGeneration: () => {
        set(state => ({
            generationProgress: { ...state.generationProgress, status: 'generating' },
        }));
    },

    cancelGeneration: () => {
        if (activeGenerator) {
            activeGenerator.cancel();
        }
        set({
            generationProgress: { ...get().generationProgress, status: 'idle' }, // Or cancelled
        });
    },

    updateGenerationProgress: (progress) => {
        set(state => ({
            generationProgress: { ...state.generationProgress, ...progress },
        }));
    },

    // ── Validation Actions ───────────────────────────────

    runValidation: () => {
        const { dataSource, fields, conditionalRules } = get();
        const issues: ValidationIssue[] = [];

        if (!dataSource) {
            issues.push({
                id: 'no-datasource',
                severity: 'error',
                title: 'No data source connected',
                description: 'Connect a CSV, JSON, or API data source to use mail merge.',
                isAutoFixable: false,
            });
        }

        if (dataSource && dataSource.rows.length === 0) {
            issues.push({
                id: 'empty-data',
                severity: 'error',
                title: 'Data source is empty',
                description: 'The connected data source contains no records.',
                isAutoFixable: false,
            });
        }

        // Check for fields with many empty values
        if (dataSource) {
            fields.forEach(field => {
                const col = dataSource.columns.find(c => c.name === field.name);
                if (col && col.emptyCount > 0) {
                    const pct = ((col.emptyCount / dataSource.rowCount) * 100).toFixed(1);
                    if (col.emptyCount > dataSource.rowCount * 0.1) {
                        issues.push({
                            id: `empty-field-${field.id}`,
                            severity: 'warning',
                            title: `Field "${field.name}" has ${col.emptyCount} empty values (${pct}%)`,
                            description: `Consider setting a default value for "${field.name}" to handle missing data.`,
                            location: field.name,
                            isAutoFixable: false,
                        });
                    }
                }
            });
        }

        // Check unused fields
        fields.filter(f => f.usageCount === 0).forEach(field => {
            issues.push({
                id: `unused-${field.id}`,
                severity: 'info',
                title: `Field "${field.name}" is not used in the template`,
                description: `This field from your data source is not referenced in any template element.`,
                location: field.name,
                isAutoFixable: false,
            });
        });

        // Check conditional rules
        conditionalRules.forEach(rule => {
            if (rule.conditions.length === 0) {
                issues.push({
                    id: `empty-rule-${rule.id}`,
                    severity: 'warning',
                    title: `Condition "${rule.name}" has no conditions defined`,
                    description: 'This rule will not filter any content.',
                    location: rule.name,
                    isAutoFixable: false,
                });
            }
            if (rule.affectedElements.length === 0) {
                issues.push({
                    id: `no-elements-${rule.id}`,
                    severity: 'warning',
                    title: `Condition "${rule.name}" has no affected elements`,
                    description: 'Add elements to this condition rule for it to have an effect.',
                    location: rule.name,
                    isAutoFixable: false,
                });
            }
        });

        set({ validationIssues: issues });
        return issues;
    },

    clearValidation: () => set({ validationIssues: [] }),
}));
