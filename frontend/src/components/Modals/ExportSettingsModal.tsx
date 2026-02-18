import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import {
    X, FileText, Image, Download, Settings, Folder, Tag,
    ChevronDown, Info, CheckCircle2
} from 'lucide-react';

type ExportFormat = 'pdf' | 'png' | 'jpeg' | 'svg';
type Quality = 'draft' | 'standard' | 'high' | 'print';

interface ExportConfig {
    format: ExportFormat;
    quality: Quality;
    dpi: number;
    namingPattern: string;
    groupBy: string;
    outputFolder: string;
    includeBleed: boolean;
    flattenLayers: boolean;
    embedFonts: boolean;
    colorProfile: string;
}

const FORMAT_OPTIONS: { id: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'pdf', label: 'PDF', icon: <FileText size={16} />, desc: 'Best for print & documents' },
    { id: 'png', label: 'PNG', icon: <Image size={16} />, desc: 'Lossless with transparency' },
    { id: 'jpeg', label: 'JPEG', icon: <Image size={16} />, desc: 'Smaller file size, photos' },
    { id: 'svg', label: 'SVG', icon: <Image size={16} />, desc: 'Scalable vector format' },
];

const QUALITY_OPTIONS: { id: Quality; label: string; dpi: number }[] = [
    { id: 'draft', label: 'Draft (72 DPI)', dpi: 72 },
    { id: 'standard', label: 'Standard (150 DPI)', dpi: 150 },
    { id: 'high', label: 'High (300 DPI)', dpi: 300 },
    { id: 'print', label: 'Print (600 DPI)', dpi: 600 },
];

export const ExportSettingsModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const [activeTab, setActiveTab] = useState<'format' | 'naming' | 'advanced'>('format');

    const [config, setConfig] = useState<ExportConfig>({
        format: 'pdf',
        quality: 'high',
        dpi: 300,
        namingPattern: '{{name}}_{{index}}',
        groupBy: 'none',
        outputFolder: 'exports/',
        includeBleed: false,
        flattenLayers: true,
        embedFonts: true,
        colorProfile: 'sRGB',
    });

    if (activeModal !== 'exportSettings') return null;

    const updateConfig = (patch: Partial<ExportConfig>) => setConfig(prev => ({ ...prev, ...patch }));

    const tabs = [
        { id: 'format', label: 'Format & Quality' },
        { id: 'naming', label: 'Naming & Organization' },
        { id: 'advanced', label: 'Advanced' },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Download size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Export Settings</h2>
                            <p className="text-xs text-slate-500">Configure batch output format and quality</p>
                        </div>
                    </div>
                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-slate-200 px-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-xs font-semibold border-b-2 transition ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tab: Format & Quality */}
                    {activeTab === 'format' && (
                        <div className="space-y-6">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Output Format</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {FORMAT_OPTIONS.map(fmt => (
                                        <button
                                            key={fmt.id}
                                            onClick={() => updateConfig({ format: fmt.id })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${config.format === fmt.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className={`${config.format === fmt.id ? 'text-emerald-600' : 'text-slate-400'}`}>{fmt.icon}</div>
                                            <span className="text-xs font-bold">{fmt.label}</span>
                                            <span className="text-[10px] text-slate-400 text-center">{fmt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quality Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Quality Preset</label>
                                <div className="space-y-2">
                                    {QUALITY_OPTIONS.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => updateConfig({ quality: q.id, dpi: q.dpi })}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition ${config.quality === q.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <span className="text-xs font-semibold text-slate-700">{q.label}</span>
                                            {config.quality === q.id && <CheckCircle2 size={14} className="text-emerald-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Naming & Organization */}
                    {activeTab === 'naming' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">File Naming Pattern</label>
                                <input
                                    type="text"
                                    value={config.namingPattern}
                                    onChange={e => updateConfig({ namingPattern: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-1.5">Available: {'{{name}}, {{index}}, {{date}}, {{field_name}}'}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Group Files By</label>
                                <select
                                    value={config.groupBy}
                                    onChange={e => updateConfig({ groupBy: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
                                >
                                    <option value="none">No Grouping (flat)</option>
                                    <option value="field">Group by Data Field</option>
                                    <option value="date">Group by Date</option>
                                    <option value="format">Group by Format</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Output Folder</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={config.outputFolder}
                                        onChange={e => updateConfig({ outputFolder: e.target.value })}
                                        className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
                                    />
                                    <button className="px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition">
                                        <Folder size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Preview</p>
                                <div className="space-y-1 text-xs font-mono text-slate-600">
                                    <p>{config.outputFolder}John_Doe_001.{config.format}</p>
                                    <p>{config.outputFolder}Jane_Smith_002.{config.format}</p>
                                    <p className="text-slate-400">...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Advanced */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-4">
                            {[
                                { label: 'Include Bleed Area', key: 'includeBleed' as const, desc: 'Add extra margin for print trimming' },
                                { label: 'Flatten All Layers', key: 'flattenLayers' as const, desc: 'Merge layers into a single image' },
                                { label: 'Embed Fonts', key: 'embedFonts' as const, desc: 'Include fonts in the output file' },
                            ].map(opt => (
                                <div key={opt.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">{opt.label}</p>
                                        <p className="text-[10px] text-slate-400">{opt.desc}</p>
                                    </div>
                                    <label className="relative inline-block w-10 h-5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config[opt.key] as boolean}
                                            onChange={e => updateConfig({ [opt.key]: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <span className="block w-full h-full bg-slate-300 rounded-full peer-checked:bg-emerald-500 transition" />
                                        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                                    </label>
                                </div>
                            ))}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Color Profile</label>
                                <select
                                    value={config.colorProfile}
                                    onChange={e => updateConfig({ colorProfile: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
                                >
                                    <option value="sRGB">sRGB (Web & Screen)</option>
                                    <option value="AdobeRGB">Adobe RGB (Photography)</option>
                                    <option value="CMYK">CMYK (Print)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50">
                    <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={closeModal} className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">
                        <span className="flex items-center gap-1.5"><Download size={12} /> Save Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
