import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { Condition, FilterOperator } from '../../types/mailMergeTypes';
import {
    X, Plus, Trash2, GitBranch, Layers, Eye, EyeOff
} from 'lucide-react';

const OPERATOR_LABELS: Record<string, string> = {
    equals: 'Equals', notEquals: 'Not equals', contains: 'Contains',
    notContains: 'Not contains', startsWith: 'Starts with', endsWith: 'Ends with',
    greaterThan: '>', lessThan: '<', greaterOrEqual: '>=', lessOrEqual: '<=',
    isEmpty: 'Is empty', isNotEmpty: 'Is not empty', isTrue: 'Is true', isFalse: 'Is false',
};

export const ConditionBuilderModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { fields, addConditionalRule } = useMailMergeStore();

    const [name, setName] = useState('');
    const [action, setAction] = useState<'show' | 'hide'>('show');
    const [logicOp, setLogicOp] = useState<'AND' | 'OR'>('AND');
    const [conditions, setConditions] = useState<Omit<Condition, 'id'>[]>([
        { field: fields[0]?.name || '', operator: 'equals', value: '' },
    ]);
    const [targetObjectIds, setTargetObjectIds] = useState<string[]>([]);
    const [replaceValue, setReplaceValue] = useState('');

    if (activeModal !== 'conditionBuilder') return null;

    const addCondition = () => {
        setConditions([...conditions, { field: fields[0]?.name || '', operator: 'equals', value: '' }]);
    };

    const updateCondition = (index: number, updates: Partial<Omit<Condition, 'id'>>) => {
        setConditions(conditions.map((c, i) => i === index ? { ...c, ...updates } : c));
    };

    const removeCondition = (index: number) => {
        if (conditions.length > 1) {
            setConditions(conditions.filter((_, i) => i !== index));
        }
    };

    const handleSave = () => {
        if (!name.trim()) return;
        addConditionalRule({
            name: name.trim(),
            conditionType: conditions.length > 1 ? 'multiple' : 'single',
            conditions: conditions.map((c, i) => ({ id: `cond-${Date.now()}-${i}`, ...c })),
            logicOperator: logicOp,
            action,
            affectedElements: targetObjectIds,
            fallbackBehavior: 'hide',
            priority: 0,
            isEnabled: true,
        });
        closeModal();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={closeModal}>
            <div
                className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <GitBranch size={18} className="text-amber-500" />
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Condition Builder</h2>
                            <p className="text-xs text-slate-500">Show, hide, or replace content based on data values</p>
                        </div>
                    </div>
                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Rule Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Show VIP discount"
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                        />
                    </div>

                    {/* Action */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Action</label>
                        <div className="flex gap-2">
                            {([
                                { id: 'show' as const, label: 'Show', icon: <Eye size={12} />, bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
                                { id: 'hide' as const, label: 'Hide', icon: <EyeOff size={12} />, bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
                            ]).map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setAction(a.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition ${action === a.id
                                        ? `${a.bg} ${a.border} ${a.text}`
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {a.icon} {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conditions */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-700">Conditions</label>
                            <div className="flex gap-1">
                                {(['AND', 'OR'] as const).map(op => (
                                    <button
                                        key={op}
                                        onClick={() => setLogicOp(op)}
                                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition ${logicOp === op
                                            ? op === 'AND' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            : 'bg-slate-100 text-slate-500'
                                            }`}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {conditions.map((cond, i) => (
                                <div key={i}>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                        <select
                                            value={cond.field}
                                            onChange={(e) => updateCondition(i, { field: e.target.value })}
                                            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[120px]"
                                        >
                                            {fields.map(f => (
                                                <option key={f.name} value={f.name}>{f.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={cond.operator}
                                            onChange={(e) => updateCondition(i, { operator: e.target.value as FilterOperator })}
                                            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[110px]"
                                        >
                                            {Object.entries(OPERATOR_LABELS).map(([val, label]) => (
                                                <option key={val} value={val}>{label}</option>
                                            ))}
                                        </select>
                                        {!['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(cond.operator) && (
                                            <input
                                                type="text"
                                                value={cond.value}
                                                onChange={(e) => updateCondition(i, { value: e.target.value })}
                                                placeholder="Value..."
                                                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white flex-1"
                                            />
                                        )}
                                        <button
                                            onClick={() => removeCondition(i)}
                                            disabled={conditions.length <= 1}
                                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-30"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                    {i < conditions.length - 1 && (
                                        <div className="text-center my-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${logicOp === 'AND' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                }`}>{logicOp}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={addCondition} className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-2">
                            <Plus size={12} /> Add Condition
                        </button>
                        {/* Conditions section end */}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50">
                    <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
                    >
                        Save Rule
                    </button>
                </div>
            </div>
        </div>
    );
};
