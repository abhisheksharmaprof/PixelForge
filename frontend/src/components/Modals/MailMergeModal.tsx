import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useDataStore } from '../../store/dataStore';
import { StitchModal } from '../common/StitchModal';
import { StitchButton } from '../common/StitchButton';
import { StitchFlex } from '../common/StitchLayout';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MailMergeModal: React.FC = () => {
    const { activeModal, closeModal } = useUIStore();
    const { excelData, loadExcelFile, mappings, autoMapPlaceholders, validateMappings } = useDataStore();
    const navigate = useNavigate();

    const isOpen = activeModal === 'mailMerge';
    const [activeTab, setActiveTab] = useState<'source' | 'fields'>('source');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && loadExcelFile) {
            await loadExcelFile(file);
            setActiveTab('fields');
        }
    };

    const handleGenerateClick = () => {
        if (!validateMappings()) {
            alert("Please map all fields first.");
            return;
        }
        closeModal();
        navigate('/bulk-generate');
    };

    return (
        <StitchModal
            isOpen={isOpen}
            onClose={() => closeModal()}
            title="Mail Merge Wizard"
            size="md"
        >
            <div className="flex flex-col h-[450px]">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-[var(--stitch-border)] mb-4 px-4 pt-2">
                    <button
                        className={`pb-2 text-sm font-medium ${activeTab === 'source' ? 'text-[var(--stitch-primary)] border-b-2 border-[var(--stitch-primary)]' : 'text-[var(--stitch-text-secondary)]'}`}
                        onClick={() => setActiveTab('source')}
                    >
                        1. Data Source
                    </button>
                    <button
                        className={`pb-2 text-sm font-medium ${activeTab === 'fields' ? 'text-[var(--stitch-primary)] border-b-2 border-[var(--stitch-primary)]' : 'text-[var(--stitch-text-secondary)]'}`}
                        onClick={() => setActiveTab('fields')}
                        disabled={!excelData}
                    >
                        2. Map Fields
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'source' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="p-4 bg-[var(--stitch-background)] rounded-full">
                                <FileSpreadsheet size={48} className="text-[var(--stitch-text-secondary)]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--stitch-text-primary)]">Connect Data Source</h3>
                                <p className="text-sm text-[var(--stitch-text-secondary)] mt-1">Upload a CSV or Excel file to populate your design.</p>
                            </div>

                            {!excelData ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="mm-file-upload"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileUpload}
                                    />
                                    <StitchButton size="lg" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2" size={18} /> Upload File
                                    </StitchButton>
                                </div>
                            ) : (
                                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg flex items-center gap-3 text-green-400">
                                    <CheckCircle2 size={24} />
                                    <div className="text-left">
                                        <div className="font-semibold">File Loaded</div>
                                        <div className="text-xs">{excelData.totalRows} rows ready</div>
                                    </div>
                                    <StitchButton variant="ghost" size="sm" onClick={() => loadExcelFile(null as any)} className="ml-auto text-green-400 hover:text-green-300">
                                        Change
                                    </StitchButton>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'fields' && excelData && (
                        <div className="space-y-4">
                            <StitchFlex justify="between" className="mb-2">
                                <span className="text-sm font-semibold text-[var(--stitch-text-secondary)]">Available Columns</span>
                                <StitchButton size="sm" variant="secondary" onClick={() => autoMapPlaceholders()}>Auto Map</StitchButton>
                            </StitchFlex>

                            <div className="space-y-2">
                                {Object.keys(mappings).map(placeholder => (
                                    <div key={placeholder} className="flex items-center gap-3 p-3 bg-[var(--stitch-surface)] rounded border border-[var(--stitch-border)]">
                                        <div className="bg-[var(--stitch-background)] text-[var(--stitch-text-primary)] px-2 py-1 rounded text-xs font-mono">
                                            {`{{${placeholder}}}`}
                                        </div>
                                        <span className="text-[var(--stitch-text-tertiary)]">→</span>
                                        <select
                                            className="flex-1 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded px-2 py-1 text-sm text-[var(--stitch-text-primary)]"
                                            value={mappings[placeholder] || ''}
                                            onChange={(e) => useDataStore.getState().mapPlaceholderToColumn(placeholder, e.target.value)}
                                        >
                                            <option value="">Select Column...</option>
                                            {excelData.columns.map(col => (
                                                <option key={col.name} value={col.name}>{col.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                                {Object.keys(mappings).length === 0 && (
                                    <div className="text-center py-8 text-[var(--stitch-text-tertiary)] border border-dashed border-[var(--stitch-border)] rounded-lg">
                                        <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                        <p>No placeholders found in design.</p>
                                        <p className="text-xs mt-1">Add text like {"{{Name}}"} to your design first.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[var(--stitch-border)] bg-[var(--stitch-surface)] flex justify-end gap-2">
                    <StitchButton variant="secondary" onClick={() => closeModal()}>Close</StitchButton>
                    <StitchButton
                        variant="primary"
                        disabled={!excelData}
                        onClick={handleGenerateClick}
                    >
                        Generate Pages
                    </StitchButton>
                </div>
            </div>
        </StitchModal>
    );
};
