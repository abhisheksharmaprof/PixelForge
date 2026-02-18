import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { GenerationStatus } from '../../types/mailMergeTypes';
import {
    X, Settings, CheckSquare, Zap, FileText, Pause, Play, StopCircle,
    Download, Archive, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';

type WizardStep = 'settings' | 'review' | 'generating' | 'results';
const STEPS: { id: WizardStep; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'review', label: 'Review' },
    { id: 'generating', label: 'Generating' },
    { id: 'results', label: 'Results' },
];

export const BatchGenerationModal: React.FC = () => {
    const { activeModal, closeModal, addNotification } = useUIStore();
    const {
        filteredRows, generationConfig, generationProgress,
        updateGenerationConfig, startGeneration, pauseGeneration, resumeGeneration, cancelGeneration,
        updateGenerationProgress, runValidation, validationIssues,
    } = useMailMergeStore();

    const [step, setStep] = useState<WizardStep>('settings');
    const [isSimulating, setIsSimulating] = useState(false);

    if (activeModal !== 'batchGeneration') return null;

    const stepIndex = STEPS.findIndex(s => s.id === step);

    // ── Simulate generation (for demo) ──
    const simulateGeneration = async () => {
        setStep('generating');
        setIsSimulating(true);
        startGeneration();
        const total = filteredRows.length || 10;
        for (let i = 1; i <= total; i++) {
            if (generationProgress.status === 'paused') {
                await new Promise(r => setTimeout(r, 500));
                i--;
                continue;
            }
            await new Promise(r => setTimeout(r, 80));
            updateGenerationProgress({
                currentRecord: i,
                percentage: Math.round((i / total) * 100),
                successCount: i,
                speed: 4.2,
                elapsedTime: i * 80,
                estimatedRemaining: (total - i) * 80,
            });
        }
        updateGenerationProgress({ status: 'completed', percentage: 100 });
        setIsSimulating(false);
        setStep('results');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={closeModal}>
            <div
                className="bg-white rounded-xl shadow-2xl w-[620px] max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">Generate Variations</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Create personalized designs for each record</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < stepIndex ? 'bg-green-500 text-white'
                                        : i === stepIndex ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {i < stepIndex ? <CheckCircle2 size={12} /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium ${i === stepIndex ? 'text-blue-600' : 'text-slate-500'
                                    }`}>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 rounded ${i < stepIndex ? 'bg-green-300' : 'bg-slate-200'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* ── Step 1: Settings ──────────── */}
                    {step === 'settings' && (
                        <div className="space-y-5">
                            {/* Record Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Record Selection</label>
                                <div className="space-y-1.5">
                                    {([['all', 'All records'], ['filtered', 'Filtered records only'], ['range', 'Custom range']] as const).map(([val, label]) => (
                                        <label key={val} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="selection"
                                                checked={generationConfig.recordSelection === val}
                                                onChange={() => updateGenerationConfig({ recordSelection: val })}
                                                className="accent-blue-500"
                                            />
                                            {label} {val === 'filtered' && <span className="text-slate-400">({filteredRows.length} records)</span>}
                                        </label>
                                    ))}
                                </div>
                                {generationConfig.recordSelection === 'range' && (
                                    <div className="flex items-center gap-2 mt-2 ml-5">
                                        <input
                                            type="number" min={1} placeholder="Start"
                                            value={generationConfig.startRecord || ''}
                                            onChange={(e) => updateGenerationConfig({ startRecord: Number(e.target.value) })}
                                            className="w-20 text-xs border border-slate-200 rounded px-2 py-1"
                                        />
                                        <span className="text-xs text-slate-400">to</span>
                                        <input
                                            type="number" min={1} placeholder="End"
                                            value={generationConfig.endRecord || ''}
                                            onChange={(e) => updateGenerationConfig({ endRecord: Number(e.target.value) })}
                                            className="w-20 text-xs border border-slate-200 rounded px-2 py-1"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Format */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Export Format</label>
                                <div className="flex gap-2">
                                    {(['pdf', 'jpeg', 'png', 'svg', 'webp'] as const).map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => updateGenerationConfig({ format: fmt })}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition ${generationConfig.format === fmt
                                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {fmt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quality & Resolution */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution (DPI)</label>
                                    <select
                                        value={generationConfig.resolution}
                                        onChange={(e) => updateGenerationConfig({ resolution: Number(e.target.value) })}
                                        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5"
                                    >
                                        <option value={72}>72 (Screen)</option>
                                        <option value={150}>150 (Medium)</option>
                                        <option value={300}>300 (Print)</option>
                                        <option value={600}>600 (High Quality)</option>
                                    </select>
                                </div>
                                {(generationConfig.format === 'jpeg' || generationConfig.format === 'webp') && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Quality ({generationConfig.quality}%)</label>
                                        <input
                                            type="range" min={10} max={100}
                                            value={generationConfig.quality}
                                            onChange={(e) => updateGenerationConfig({ quality: Number(e.target.value) })}
                                            className="w-full accent-blue-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Filename Pattern */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Filename Pattern</label>
                                <input
                                    type="text"
                                    value={generationConfig.filenamePattern}
                                    onChange={(e) => updateGenerationConfig({ filenamePattern: e.target.value })}
                                    placeholder="{first_name}_{id}"
                                    className="w-full text-xs border border-slate-200 rounded-md px-3 py-1.5"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Use field names in curly braces. Example: output_{'{first_name}'}_{'{id}'}.pdf</p>
                            </div>

                            {/* Additional options */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={generationConfig.createArchive}
                                        onChange={(e) => updateGenerationConfig({ createArchive: e.target.checked })}
                                        className="accent-blue-500"
                                    />
                                    Create ZIP archive
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={generationConfig.includeMetadata}
                                        onChange={(e) => updateGenerationConfig({ includeMetadata: e.target.checked })}
                                        className="accent-blue-500"
                                    />
                                    Include metadata report
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Review ────────────── */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="text-xs font-bold text-blue-800 mb-2">Generation Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                                    <span>Records: <strong>{filteredRows.length}</strong></span>
                                    <span>Format: <strong>{generationConfig.format.toUpperCase()}</strong></span>
                                    <span>Resolution: <strong>{generationConfig.resolution} DPI</strong></span>
                                    <span>Archive: <strong>{generationConfig.createArchive ? 'Yes' : 'No'}</strong></span>
                                </div>
                            </div>
                            {validationIssues.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-700">Validation Warnings</h4>
                                    {validationIssues.filter(i => i.severity !== 'info').slice(0, 5).map(issue => (
                                        <div key={issue.id} className={`flex items-start gap-2 text-xs p-2 rounded ${issue.severity === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <strong>{issue.title}</strong>
                                                <p className="opacity-80">{issue.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Generating ────────── */}
                    {step === 'generating' && (
                        <div className="text-center space-y-5">
                            {/* Circular Progress */}
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" strokeWidth="8"
                                        strokeDasharray={`${generationProgress.percentage * 2.64} ${264 - generationProgress.percentage * 2.64}`}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 0.3s' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-800">{generationProgress.percentage}%</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Generating {generationProgress.currentRecord} of {generationProgress.totalRecords}
                                </p>
                                <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${generationProgress.percentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                                <span>Elapsed: {(generationProgress.elapsedTime / 1000).toFixed(1)}s</span>
                                <span>~{(generationProgress.estimatedRemaining / 1000).toFixed(0)}s remaining</span>
                                <span>{generationProgress.speed.toFixed(1)} rec/s</span>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                {generationProgress.status === 'generating' ? (
                                    <button
                                        onClick={pauseGeneration}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                                    >
                                        <Pause size={12} /> Pause
                                    </button>
                                ) : (
                                    <button
                                        onClick={resumeGeneration}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                    >
                                        <Play size={12} /> Resume
                                    </button>
                                )}
                                <button
                                    onClick={() => { cancelGeneration(); setStep('settings'); }}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                >
                                    <StopCircle size={12} /> Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Results ───────────── */}
                    {step === 'results' && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Generation Complete!</h3>
                            <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    {generationProgress.successCount} successful
                                </span>
                                {generationProgress.errorCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle size={14} className="text-red-500" />
                                        {generationProgress.errorCount} errors
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <button className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                                    <Download size={14} /> Download All
                                </button>
                                <button className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                    <Archive size={14} /> Download ZIP
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                        {step === 'results' ? 'Close' : 'Cancel'}
                    </button>
                    <div className="flex gap-2">
                        {step !== 'settings' && step !== 'generating' && step !== 'results' && (
                            <button
                                onClick={() => setStep(STEPS[stepIndex - 1].id)}
                                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                            >
                                Back
                            </button>
                        )}
                        {step === 'settings' && (
                            <button
                                onClick={() => { runValidation(); setStep('review'); }}
                                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                            >
                                Next: Review
                            </button>
                        )}
                        {step === 'review' && (
                            <button
                                onClick={simulateGeneration}
                                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                            >
                                <Zap size={12} /> Start Generation
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
