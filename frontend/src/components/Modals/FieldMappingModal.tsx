import React, { useState, useMemo } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import {
    X, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Search,
    Type, Image, Hash, Calendar, ToggleLeft, List, Zap, Info
} from 'lucide-react';

export const FieldMappingModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { fields, dataSource } = useMailMergeStore();

    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    if (activeModal !== 'fieldMapping') return null;

    const columns = dataSource?.columns || [];
    const filteredFields = fields.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.displayLabel || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMap = (fieldName: string, columnName: string) => {
        setMappings(prev => ({ ...prev, [fieldName]: columnName }));
    };

    const handleAutoMap = () => {
        const auto: Record<string, string> = {};
        fields.forEach(f => {
            const exact = columns.find(c => c.name.toLowerCase() === f.name.toLowerCase());
            if (exact) auto[f.name] = exact.name;
        });
        setMappings(prev => ({ ...prev, ...auto }));
    };

    const handleApply = () => {
        // In a real app, persist mappings to store
        closeModal();
    };

    const mappedCount = Object.keys(mappings).filter(k => mappings[k]).length;

    const FieldTypeIcon: React.FC<{ type: string }> = ({ type }) => {
        switch (type) {
            case 'text': return <Type size={12} />;
            case 'image': return <Image size={12} />;
            case 'number': return <Hash size={12} />;
            case 'date': return <Calendar size={12} />;
            case 'boolean': return <ToggleLeft size={12} />;
            case 'array': return <List size={12} />;
            default: return <Type size={12} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Field Mapping</h2>
                        <p className="text-xs text-slate-500">Connect template fields to your data columns</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleAutoMap} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                            <Zap size={12} /> Auto-Map
                        </button>
                        <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-slate-100">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search fields..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-300 transition"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 px-6 py-2 text-xs text-slate-500 bg-slate-50/60">
                    <span>{fields.length} template fields</span>
                    <span>{columns.length} data columns</span>
                    <span className={mappedCount === fields.length ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {mappedCount}/{fields.length} mapped
                    </span>
                </div>

                {/* Mapping Table */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                    <div className="space-y-2">
                        {filteredFields.map(field => {
                            const mapped = mappings[field.name];
                            return (
                                <div key={field.id} className={`flex items-center gap-3 p-3 rounded-xl border transition ${mapped ? 'bg-green-50/60 border-green-200' : 'bg-white border-slate-200'}`}>
                                    {/* Left: Field */}
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${mapped ? 'bg-green-500' : 'bg-slate-400'}`}>
                                            <FieldTypeIcon type={field.type} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">{field.displayLabel || field.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{`{{${field.name}}}`}</p>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight size={14} className="text-slate-300 shrink-0" />

                                    {/* Right: Column selector */}
                                    <select
                                        className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition ${mapped ? 'border-green-300 bg-white focus:border-green-400' : 'border-slate-200 bg-slate-50 focus:border-blue-300'}`}
                                        value={mapped || ''}
                                        onChange={e => handleMap(field.name, e.target.value)}
                                    >
                                        <option value="">— Select Column —</option>
                                        {columns.map(col => (
                                            <option key={col.name} value={col.name}>{col.name}</option>
                                        ))}
                                    </select>

                                    {/* Status icon */}
                                    <div className="w-5 shrink-0">
                                        {mapped ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={14} className="text-amber-400" />}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredFields.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Info size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">No fields match your search</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
                    <p className="text-[10px] text-slate-400">Unmapped fields will use default values</p>
                    <div className="flex gap-2">
                        <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                        <button onClick={handleApply} className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Apply Mapping</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
