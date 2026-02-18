import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import {
    X, AlertTriangle, AlertCircle, Info, CheckCircle2,
    ChevronDown, ChevronRight, Eye, Wrench, XCircle, Filter
} from 'lucide-react';

type Severity = 'error' | 'warning' | 'info';

interface ValidationItem {
    id: string;
    severity: Severity;
    field: string;
    message: string;
    records: number[];
    suggestion?: string;
}

// Placeholder validation items – in production, these come from the generation engine
const MOCK_ISSUES: ValidationItem[] = [
    { id: 'v1', severity: 'error', field: 'email', message: 'Missing value in 3 records', records: [12, 45, 88], suggestion: 'Add a default value or remove these records' },
    { id: 'v2', severity: 'error', field: 'profile_image', message: 'Invalid image URL in 2 records', records: [23, 67], suggestion: 'Verify image URLs are accessible' },
    { id: 'v3', severity: 'warning', field: 'company', message: 'Text exceeds element bounds in 5 records', records: [3, 18, 24, 55, 91], suggestion: 'Enable auto-shrink or increase element size' },
    { id: 'v4', severity: 'warning', field: 'title', message: 'Contains special characters that may not render', records: [7], suggestion: 'Check font supports required characters' },
    { id: 'v5', severity: 'info', field: 'notes', message: '12 records have empty optional field', records: [1, 2, 5, 8, 14, 19, 22, 30, 41, 50, 61, 73], suggestion: 'This is normal for optional fields' },
    { id: 'v6', severity: 'info', field: 'date', message: 'Date format varies across records', records: [4, 9, 15], suggestion: 'Set a consistent date format in Field Properties' },
];

const SEVERITY_CONFIG: Record<Severity, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
    error: { icon: <XCircle size={14} />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Errors' },
    warning: { icon: <AlertTriangle size={14} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warnings' },
    info: { icon: <Info size={14} />, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Info' },
};

export const ValidationReportModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const [filter, setFilter] = useState<Severity | 'all'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

    if (activeModal !== 'validationReport') return null;

    const issues = MOCK_ISSUES.filter(i => !ignoredIds.has(i.id));
    const filtered = filter === 'all' ? issues : issues.filter(i => i.severity === filter);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warnCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    const handleIgnore = (id: string) => {
        setIgnoredIds(prev => new Set([...prev, id]));
        if (expandedId === id) setExpandedId(null);
    };

    const canProceed = errorCount === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${errorCount > 0 ? 'bg-red-100 text-red-600' : warnCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                            {errorCount > 0 ? <AlertCircle size={18} /> : warnCount > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Validation Report</h2>
                            <p className="text-xs text-slate-500">
                                {issues.length === 0 ? 'All checks passed!' : `${issues.length} issues found across your data`}
                            </p>
                        </div>
                    </div>
                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Summary Badges */}
                <div className="flex gap-3 px-6 py-3 border-b border-slate-100">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        All ({issues.length})
                    </button>
                    {(['error', 'warning', 'info'] as Severity[]).map(sev => {
                        const count = issues.filter(i => i.severity === sev).length;
                        const cfg = SEVERITY_CONFIG[sev];
                        return (
                            <button
                                key={sev}
                                onClick={() => setFilter(sev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${filter === sev ? `${cfg.bg} ${cfg.color} ring-1 ring-current` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {cfg.icon} {cfg.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Issues List */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
                            <p className="text-sm font-medium">No issues in this category</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(issue => {
                                const cfg = SEVERITY_CONFIG[issue.severity];
                                const isExpanded = expandedId === issue.id;
                                return (
                                    <div key={issue.id} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition`}>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                        >
                                            <span className={cfg.color}>{cfg.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700">{issue.message}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    Field: <span className="font-mono font-semibold">{`{{${issue.field}}}`}</span> · {issue.records.length} record{issue.records.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-3 space-y-2 border-t border-slate-200/60">
                                                {issue.suggestion && (
                                                    <div className="flex items-start gap-2 mt-2 p-2.5 bg-white rounded-lg">
                                                        <Wrench size={12} className="text-slate-400 mt-0.5 shrink-0" />
                                                        <p className="text-[11px] text-slate-600">{issue.suggestion}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-400">Affected rows: </span>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {issue.records.slice(0, 8).map(r => (
                                                            <span key={r} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">#{r}</span>
                                                        ))}
                                                        {issue.records.length > 8 && <span className="text-[10px] text-slate-400">+{issue.records.length - 8} more</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <button className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                                                        <Eye size={10} /> View Records
                                                    </button>
                                                    <button
                                                        onClick={() => handleIgnore(issue.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                                    >
                                                        <XCircle size={10} /> Ignore
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
                    <p className="text-[10px] text-slate-400">
                        {canProceed ? '✅ No errors — safe to proceed with generation' : '⚠️ Fix errors before proceeding'}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Close</button>
                        <button
                            onClick={closeModal}
                            disabled={!canProceed}
                            className={`px-5 py-2 text-xs font-semibold rounded-lg transition ${canProceed ? 'text-white bg-green-600 hover:bg-green-700' : 'text-slate-400 bg-slate-200 cursor-not-allowed'}`}
                        >
                            Proceed to Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
