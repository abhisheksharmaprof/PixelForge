import React, { useState, useMemo } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { DataFilter, DataSort, FieldType, FilterOperator, LogicOperator } from '../../types/mailMergeTypes';
import {
    X, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Save, RotateCcw,
    Filter, ArrowUpDown, Download, ChevronDown
} from 'lucide-react';

// ─── Operator options based on field type ──────────────

const TEXT_OPERATORS: { value: FilterOperator; label: string }[] = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
    { value: 'matchesRegex', label: 'Matches regex' },
];

const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'greaterOrEqual', label: 'Greater or equal' },
    { value: 'lessOrEqual', label: 'Less or equal' },
    { value: 'between', label: 'Between' },
    { value: 'notBetween', label: 'Not between' },
];

const DATE_OPERATORS: { value: FilterOperator; label: string }[] = [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'isToday', label: 'Is today' },
    { value: 'pastXDays', label: 'Past X days' },
    { value: 'nextXDays', label: 'Next X days' },
    { value: 'thisWeek', label: 'This week' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'thisYear', label: 'This year' },
];

const BOOLEAN_OPERATORS: { value: FilterOperator; label: string }[] = [
    { value: 'isTrue', label: 'Is true' },
    { value: 'isFalse', label: 'Is false' },
];

const ARRAY_OPERATORS: { value: FilterOperator; label: string }[] = [
    { value: 'contains', label: 'Contains' },
    { value: 'containsAnyOf', label: 'Contains any of' },
    { value: 'containsAllOf', label: 'Contains all of' },
    { value: 'arrayIsEmpty', label: 'Is empty' },
    { value: 'lengthEquals', label: 'Length equals' },
    { value: 'lengthGreaterThan', label: 'Length greater than' },
];

function getOperatorsForType(type: FieldType) {
    switch (type) {
        case 'text': return TEXT_OPERATORS;
        case 'number': return NUMBER_OPERATORS;
        case 'date': return DATE_OPERATORS;
        case 'boolean': return BOOLEAN_OPERATORS;
        case 'array': return ARRAY_OPERATORS;
        default: return TEXT_OPERATORS;
    }
}

// ─── No-value operators (do not need a value input) ────

const NO_VALUE_OPERATORS = new Set<string>([
    'isEmpty', 'isNotEmpty', 'isTrue', 'isFalse', 'isToday',
    'thisWeek', 'thisMonth', 'thisYear', 'arrayIsEmpty',
]);

const DUAL_VALUE_OPERATORS = new Set<string>(['between', 'notBetween']);

// ─── Component ──────────────────────────────────────────

export const DataFilterSortModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const {
        dataSource, fields, activeFilters, activeSorts, filteredRows, filterPresets,
        addFilter, updateFilter, removeFilter, clearAllFilters,
        addSort, updateSort, removeSort, clearAllSorts,
        applyFiltersAndSorts, saveFilterPreset, loadFilterPreset, deleteFilterPreset,
    } = useMailMergeStore();

    const [showSavePreset, setShowSavePreset] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);

    if (activeModal !== 'dataFilterSort') return null;
    if (!dataSource) return null;

    const fieldColumns = fields.map(f => ({ name: f.name, type: f.type }));

    const getFieldType = (fieldName: string): FieldType => {
        const field = fields.find(f => f.name === fieldName);
        return field?.type || 'text';
    };

    // ── Add empty filter ──
    const handleAddFilter = () => {
        const firstField = fieldColumns[0]?.name || '';
        const type = getFieldType(firstField);
        const ops = getOperatorsForType(type);
        addFilter({
            field: firstField,
            operator: ops[0].value,
            value: '',
            logicOperator: 'AND',
        });
    };

    // ── Add empty sort ──
    const handleAddSort = () => {
        const firstField = fieldColumns[0]?.name || '';
        addSort({
            field: firstField,
            direction: 'asc',
            priority: activeSorts.length + 1,
        });
    };

    // ── Save preset ──
    const handleSavePreset = () => {
        if (presetName.trim()) {
            saveFilterPreset(presetName.trim());
            setPresetName('');
            setShowSavePreset(false);
        }
    };

    const totalRecords = dataSource.rowCount;
    const matchedRecords = filteredRows.length;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={closeModal}>
            <div
                className="bg-white rounded-xl shadow-2xl w-[860px] max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Filter & Sort Data</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Refine which records to include in your mail merge
                        </p>
                    </div>
                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Content — Two columns */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex divide-x divide-slate-200" style={{ minHeight: 340 }}>
                        {/* ── LEFT: Filters (60%) ───────────── */}
                        <div className="flex-[3] p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={15} className="text-blue-500" />
                                    <h3 className="text-sm font-bold text-slate-800">Filter Records</h3>
                                    {activeFilters.length > 0 && (
                                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {activeFilters.length} active
                                        </span>
                                    )}
                                </div>
                                {/* Saved Filters dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2 py-1 hover:bg-slate-50 transition"
                                    >
                                        <Save size={11} /> Saved Filters <ChevronDown size={10} />
                                    </button>
                                    {showPresetDropdown && (
                                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[180px] py-1">
                                            {filterPresets.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-slate-400">No saved filters</div>
                                            ) : (
                                                filterPresets.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50">
                                                        <button
                                                            onClick={() => { loadFilterPreset(p.id); setShowPresetDropdown(false); }}
                                                            className="text-xs text-slate-700 font-medium"
                                                        >
                                                            {p.name}
                                                        </button>
                                                        <button onClick={() => deleteFilterPreset(p.id)} className="text-slate-400 hover:text-red-500">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filter rows */}
                            <div className="space-y-2">
                                {activeFilters.map((filter, index) => {
                                    const fieldType = getFieldType(filter.field);
                                    const operators = getOperatorsForType(fieldType);
                                    const needsValue = !NO_VALUE_OPERATORS.has(filter.operator);
                                    const needsDualValue = DUAL_VALUE_OPERATORS.has(filter.operator);

                                    return (
                                        <div key={filter.id}>
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                                {/* Field dropdown */}
                                                <select
                                                    value={filter.field}
                                                    onChange={(e) => {
                                                        const newType = getFieldType(e.target.value);
                                                        const newOps = getOperatorsForType(newType);
                                                        updateFilter(filter.id, {
                                                            field: e.target.value,
                                                            operator: newOps[0].value,
                                                            value: '',
                                                        });
                                                    }}
                                                    className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[120px] font-medium text-slate-700"
                                                >
                                                    {fieldColumns.map(fc => (
                                                        <option key={fc.name} value={fc.name}>{fc.name}</option>
                                                    ))}
                                                </select>

                                                {/* Operator dropdown */}
                                                <select
                                                    value={filter.operator}
                                                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                                                    className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[120px] text-slate-600"
                                                >
                                                    {operators.map(op => (
                                                        <option key={op.value} value={op.value}>{op.label}</option>
                                                    ))}
                                                </select>

                                                {/* Value input */}
                                                {needsValue && (
                                                    <input
                                                        type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                                                        value={filter.value}
                                                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                                        placeholder="Value..."
                                                        className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white flex-1 min-w-[80px] text-slate-700"
                                                    />
                                                )}

                                                {/* Second value for between */}
                                                {needsDualValue && (
                                                    <>
                                                        <span className="text-[10px] text-slate-400 font-medium">AND</span>
                                                        <input
                                                            type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                                                            value={filter.secondValue || ''}
                                                            onChange={(e) => updateFilter(filter.id, { secondValue: e.target.value })}
                                                            placeholder="Max..."
                                                            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[70px] flex-1 text-slate-700"
                                                        />
                                                    </>
                                                )}

                                                {/* Delete */}
                                                <button
                                                    onClick={() => removeFilter(filter.id)}
                                                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex-shrink-0"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>

                                            {/* Logic operator between rows */}
                                            {index < activeFilters.length - 1 && (
                                                <div className="flex justify-center my-1.5">
                                                    <button
                                                        onClick={() => updateFilter(filter.id, {
                                                            logicOperator: filter.logicOperator === 'AND' ? 'OR' : 'AND',
                                                        })}
                                                        className={`text-[10px] font-bold px-3 py-0.5 rounded-full transition cursor-pointer ${filter.logicOperator === 'AND'
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                            }`}
                                                    >
                                                        {filter.logicOperator}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add filter + Save */}
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={handleAddFilter}
                                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    <Plus size={12} /> Add Filter
                                </button>
                                {activeFilters.length > 0 && (
                                    <>
                                        <span className="text-slate-300">|</span>
                                        {showSavePreset ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={presetName}
                                                    onChange={(e) => setPresetName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                                                    placeholder="Preset name..."
                                                    className="text-xs border border-slate-200 rounded px-2 py-1 w-[120px]"
                                                    autoFocus
                                                />
                                                <button onClick={handleSavePreset} className="text-xs text-green-600 font-semibold">Save</button>
                                                <button onClick={() => setShowSavePreset(false)} className="text-xs text-slate-400">Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowSavePreset(true)}
                                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                                            >
                                                <Save size={10} /> Save as preset
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── RIGHT: Sorts (40%) ───────────── */}
                        <div className="flex-[2] p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ArrowUpDown size={15} className="text-purple-500" />
                                <h3 className="text-sm font-bold text-slate-800">Sort Records</h3>
                                {activeSorts.length > 0 && (
                                    <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                        {activeSorts.length} sort{activeSorts.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {/* Sort rows */}
                            <div className="space-y-2">
                                {activeSorts.map((sort, index) => (
                                    <div key={sort.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                        {/* Priority */}
                                        <span className="text-[10px] font-bold text-slate-400 w-4 text-center flex-shrink-0">
                                            {index + 1}
                                        </span>

                                        {/* Drag handle */}
                                        <GripVertical size={12} className="text-slate-300 cursor-grab flex-shrink-0" />

                                        {/* Field dropdown */}
                                        <select
                                            value={sort.field}
                                            onChange={(e) => updateSort(sort.id, { field: e.target.value })}
                                            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white flex-1 font-medium text-slate-700"
                                        >
                                            {fieldColumns.map(fc => (
                                                <option key={fc.name} value={fc.name}>{fc.name}</option>
                                            ))}
                                        </select>

                                        {/* Direction toggle */}
                                        <button
                                            onClick={() => updateSort(sort.id, { direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                                            className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-md border transition ${sort.direction === 'asc'
                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                                }`}
                                        >
                                            {sort.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                            {sort.direction === 'asc' ? 'ASC' : 'DESC'}
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => removeSort(sort.id)}
                                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex-shrink-0"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddSort}
                                className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 mt-3 transition"
                            >
                                <Plus size={12} /> Add Sort
                            </button>
                        </div>
                    </div>

                    {/* ── Results Preview ────────────────── */}
                    <div className="px-5 pb-4">
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">Results Preview</span>
                                    <span className={`text-xs font-medium ${matchedRecords === totalRecords ? 'text-slate-500' : 'text-blue-600'}`}>
                                        Showing {matchedRecords} of {totalRecords} records
                                    </span>
                                    {matchedRecords < totalRecords && (
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                            {((matchedRecords / totalRecords) * 100).toFixed(0)}% match
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto max-h-[200px]">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-3 py-2 text-left font-semibold text-slate-500 border-b border-slate-200 w-8">#</th>
                                            {fields.slice(0, 6).map(f => (
                                                <th key={f.name} className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap">
                                                    {f.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRows.slice(0, 5).map((row, ri) => (
                                            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                <td className="px-3 py-1.5 text-slate-400 border-b border-slate-100">{ri + 1}</td>
                                                {fields.slice(0, 6).map(f => (
                                                    <td key={f.name} className="px-3 py-1.5 text-slate-600 border-b border-slate-100 whitespace-nowrap max-w-[130px] truncate">
                                                        {String(row[f.name] ?? '')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        {filteredRows.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-6 text-slate-400">
                                                    No records match the current filters
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { clearAllFilters(); clearAllSorts(); }}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition"
                        >
                            <RotateCcw size={11} /> Reset All
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearAllFilters}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={clearAllSorts}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                            Clear Sorts
                        </button>
                        <button
                            onClick={() => { applyFiltersAndSorts(); closeModal(); }}
                            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
