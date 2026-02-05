import { create } from 'zustand';
import { ExcelService, ExcelData } from '../utils/excelService';

export interface Placeholder {
    id: string;
    name: string;
    type: 'text' | 'image' | 'link' | 'emoji';
    objectId?: string; // fabric object ID for reference
    isMapped: boolean;
    format?: string;
}

export interface Filter {
    column: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'notEmpty' | 'isEmpty';
    value: string;
}

interface DataState {
    // File state
    excelFile: File | null;
    excelData: ExcelData | null;
    headerRowIndex: number; // Which row contains headers (0-based)

    // Data processing state
    filteredRows: any[];
    previewRowIndex: number;
    isPreviewMode: boolean;

    // Mapping state
    placeholders: Placeholder[];
    mappings: Record<string, string>; // placeholderName -> columnName

    // Actions
    loadExcelFile: (file: File, headerRow?: number) => Promise<void>;
    setHeaderRow: (rowIndex: number) => void;
    clearExcelData: () => void;

    filterRows: (filters: Filter[]) => void;
    sortRows: (column: string, order: 'asc' | 'desc') => void;
    setPreviewRow: (index: number) => void;
    setPreviewMode: (enabled: boolean) => void;

    // Mapping Actions
    scanForPlaceholders: (canvasObjects: any[]) => void;
    mapPlaceholderToColumn: (placeholderId: string, columnName: string) => void;
    autoMapPlaceholders: () => number; // Returns count of auto-mapped
    validateMappings: () => boolean;
}

export const useDataStore = create<DataState>((set, get) => ({
    excelFile: null,
    excelData: null,
    headerRowIndex: 0,
    filteredRows: [],
    previewRowIndex: 0,
    isPreviewMode: false,
    placeholders: [],
    mappings: {},

    loadExcelFile: async (file, headerRow = 0) => {
        try {
            let data: ExcelData;
            if (file.name.endsWith('.csv')) {
                data = await ExcelService.parseCSVFile(file);
            } else {
                data = await ExcelService.parseExcelFile(file);
            }

            set({
                excelFile: file,
                excelData: data,
                headerRowIndex: headerRow,
                filteredRows: data.rows,
                previewRowIndex: 0,
            });

            // Attempt auto-map after load
            get().autoMapPlaceholders();
        } catch (error) {
            console.error('Error loading file:', error);
            throw error;
        }
    },

    setHeaderRow: (rowIndex) => {
        const { excelData } = get();
        if (!excelData || !excelData.rawRows || rowIndex < 0 || rowIndex >= excelData.rawRows.length) return;

        // Re-process data with new header row using the ExcelService
        const reprocessed = ExcelService.processWithHeaderRow(
            excelData.rawRows,
            rowIndex,
            excelData.totalColumns
        );

        set({
            headerRowIndex: rowIndex,
            excelData: reprocessed,
            filteredRows: reprocessed.rows,
            previewRowIndex: 0,
        });
    },

    clearExcelData: () => {
        set({
            excelFile: null,
            excelData: null,
            filteredRows: [],
            previewRowIndex: 0,
            isPreviewMode: false,
        });
    },

    filterRows: (filters) => {
        const { excelData } = get();
        if (!excelData) return;

        // If no filters, reset to all rows
        if (filters.length === 0) {
            set({ filteredRows: excelData.rows });
            return;
        }

        const filtered = excelData.rows.filter(row => {
            return filters.every(filter => {
                const cellValue = String(row[filter.column] || '').toLowerCase();
                const filterValue = filter.value.toLowerCase();

                switch (filter.operator) {
                    case 'equals': return cellValue === filterValue;
                    case 'contains': return cellValue.includes(filterValue);
                    case 'startsWith': return cellValue.startsWith(filterValue);
                    case 'endsWith': return cellValue.endsWith(filterValue);
                    case 'notEmpty': return cellValue !== '';
                    case 'isEmpty': return cellValue === '';
                    case 'greaterThan': return Number(cellValue) > Number(filterValue);
                    case 'lessThan': return Number(cellValue) < Number(filterValue);
                    default: return true;
                }
            });
        });

        set({ filteredRows: filtered });
    },

    sortRows: (column, order) => {
        const { filteredRows } = get();

        const sorted = [...filteredRows].sort((a, b) => {
            const valA = a[column];
            const valB = b[column];

            if (typeof valA === 'number' && typeof valB === 'number') {
                return order === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (order === 'asc') return strA.localeCompare(strB);
            return strB.localeCompare(strA);
        });

        set({ filteredRows: sorted });
    },

    setPreviewRow: (index) => {
        set({ previewRowIndex: index });
    },

    setPreviewMode: (enabled) => {
        set({ isPreviewMode: enabled });
    },

    scanForPlaceholders: (canvasObjects) => {
        const placeholders: Placeholder[] = [];
        const regex = /\{\{([^}]+)\}\}/g; // Matches {{name}}

        canvasObjects.forEach(obj => {
            // Check text objects
            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                const text = (obj as any).text || '';
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const name = match[1];
                    // Check if already exists to avoid duplicates
                    if (!placeholders.some(p => p.name === name)) {
                        placeholders.push({
                            id: (obj as any).elementId || `ph_${name}`,
                            name: name,
                            type: 'text',
                            objectId: (obj as any).elementId,
                            isMapped: false, // Will be updated by check
                            format: 'none'
                        });
                    }
                }
            }

            // Check QR/Barcodes with placeholder props
            if ((obj as any).isPlaceholder && (obj as any).placeholderName) {
                const name = (obj as any).placeholderName;
                if (!placeholders.some(p => p.name === name)) {
                    // Detect type based on object type
                    let placeholderType: 'text' | 'image' | 'link' | 'emoji' = 'text';
                    if (obj.type === 'image') {
                        placeholderType = 'image';
                    }

                    placeholders.push({
                        id: (obj as any).elementId,
                        name: name,
                        type: placeholderType,
                        objectId: (obj as any).elementId,
                        isMapped: false,
                        format: 'none'
                    });
                }
            }
        });

        // Update mapped status based on current mappings
        const currentMappings = get().mappings;
        const updatedPlaceholders = placeholders.map(p => ({
            ...p,
            isMapped: !!currentMappings[p.name]
        }));

        set({ placeholders: updatedPlaceholders });
    },

    mapPlaceholderToColumn: (placeholderName, columnName) => {
        set(state => {
            const newMappings = { ...state.mappings, [placeholderName]: columnName };

            const newPlaceholders = state.placeholders.map(p => {
                if (p.name === placeholderName || p.id === placeholderName) { // Handle both ID and name usage generally
                    return { ...p, isMapped: !!columnName };
                }
                return p;
            });

            return {
                mappings: newMappings,
                placeholders: newPlaceholders
            };
        });
    },

    autoMapPlaceholders: () => {
        const { excelData, placeholders, mappings } = get();
        if (!excelData) return 0;

        let mappedCount = 0;
        const newMappings = { ...mappings };

        placeholders.forEach(p => {
            // Find case-insensitive match
            const matchingCol = excelData.columns.find(
                col => col.name.toLowerCase() === p.name.toLowerCase()
            );

            if (matchingCol && !newMappings[p.name]) {
                newMappings[p.name] = matchingCol.name;
                mappedCount++;
            }
        });

        // Update state
        set(state => ({
            mappings: newMappings,
            placeholders: state.placeholders.map(p => ({
                ...p,
                isMapped: !!newMappings[p.name]
            }))
        }));

        return mappedCount;
    },

    validateMappings: () => {
        const { placeholders, mappings } = get();
        return placeholders.every(p => !!mappings[p.name]);
    }
}));
