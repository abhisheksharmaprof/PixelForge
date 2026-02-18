import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fabric } from 'fabric';
import { StitchContainer, StitchFlex, StitchGrid } from '../../components/common/StitchLayout';
import { StitchButton } from '../../components/common/StitchButton';
import { StitchCard } from '../../components/common/StitchCard';
import { StitchInput } from '../../components/common/StitchInput';
import {
    ChevronRight, Database, FileSpreadsheet, LayoutTemplate, Layers, CheckCircle2,
    Upload, FileText, AlertCircle, ArrowRight, Settings, Download
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useTemplateStore } from '../../store/templateStore';
import { useCanvasStore } from '../../store/canvasStore';
import { generatePDF, generateWord, downloadAsZip, downloadFile, sanitizeFilename, getExtension, GeneratedFile } from '../../utils/exportService';

const steps = [
    { id: 'source', title: 'Data Source', icon: Database },
    { id: 'mapping', title: 'Connect Data', icon: LayoutTemplate },
    { id: 'settings', title: 'Settings', icon: Settings },
    { id: 'generate', title: 'Generate', icon: CheckCircle2 },
];

const BulkGenerateScreen: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const { excelData, loadExcelFile, mappings, validateMappings, autoMapPlaceholders } = useDataStore();
    const { currentTemplate } = useTemplateStore();
    const { canvas } = useCanvasStore();

    // Generation State
    const [generating, setGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationResults, setGenerationResults] = useState<any>(null);

    // Config State
    const [config, setConfig] = useState({
        fileFormat: 'pdf',
        namingPattern: 'Document_{{Name}}',
        batchName: `Batch_${new Date().toISOString().split('T')[0]}`,
        dpi: 300,
        quality: 'high',
        pageSize: 'A4',
        orientation: 'portrait'
    });

    useEffect(() => {
        if (!currentTemplate) {
            navigate('/dashboard'); // Redirect if no template selected (or handle load)
        }
    }, [currentTemplate, navigate]);

    const handleNext = async () => {
        if (currentStep === 0 && !excelData) return; // Validate Step 1
        if (currentStep === 1 && !validateMappings()) return; // Validate Step 2

        if (currentStep === steps.length - 1) {
            startGeneration();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        else navigate(-1);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && loadExcelFile) {
            await loadExcelFile(file);
        }
    };

    const startGeneration = async () => {
        if (!canvas || !excelData || generating) return;

        setGenerating(true);
        setGenerationProgress(0);

        try {
            const rowIndices = Array.from({ length: excelData.totalRows }, (_, i) => i);
            const generatedFiles: GeneratedFile[] = [];
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const templateJSON = canvas.toJSON();

            for (let i = 0; i < rowIndices.length; i++) {
                const rowIndex = rowIndices[i];
                const row = excelData.rows[rowIndex];
                setGenerationProgress(Math.round(((i + 1) / rowIndices.length) * 100));

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvasWidth;
                tempCanvas.height = canvasHeight;
                const fabricTempCanvas = new fabric.Canvas(tempCanvas, { width: canvasWidth, height: canvasHeight });

                await new Promise<void>((resolve) => {
                    fabricTempCanvas.loadFromJSON(templateJSON, () => {
                        fabricTempCanvas.getObjects().forEach((obj: any) => {
                            if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
                                let text = obj.text || '';
                                const regex = /\{\{([^}]+)\}\}/g;
                                text = text.replace(regex, (match: string, placeholder: string) => {
                                    const columnName = mappings[placeholder] || placeholder;
                                    const value = row[columnName];
                                    return value !== undefined ? String(value) : match;
                                });
                                obj.set('text', text);
                            }
                        });
                        fabricTempCanvas.renderAll();
                        resolve();
                    });
                });

                // Generate Filename
                let fileName = config.namingPattern;
                const placeholderRegex = /\{\{([^}]+)\}\}/g;
                fileName = fileName.replace(placeholderRegex, (match: string, placeholder: string) => {
                    const columnName = mappings[placeholder] || placeholder;
                    const value = row[columnName];
                    return value !== undefined ? sanitizeFilename(String(value)) : placeholder;
                });
                if (!fileName.trim()) fileName = `Document_${rowIndex + 1}`;

                // Export
                const dataUrl = fabricTempCanvas.toDataURL({ format: 'png', quality: 1, multiplier: config.dpi / 72 });
                let blob: Blob;
                const extension = getExtension(config.fileFormat as any);

                if (config.fileFormat === 'pdf') {
                    blob = await generatePDF(dataUrl, canvasWidth, canvasHeight, fileName);
                } else {
                    // Default to PNG for now if not PDF
                    const response = await fetch(dataUrl);
                    blob = await response.blob();
                }

                generatedFiles.push({
                    name: `${fileName}${extension || '.png'}`,
                    blob,
                });
                fabricTempCanvas.dispose();
            }

            // Download
            if (generatedFiles.length === 1) {
                downloadFile(generatedFiles[0].blob, generatedFiles[0].name);
            } else {
                await downloadAsZip(generatedFiles, `${config.batchName}.zip`);
            }

            setGenerationResults({ success: true, count: generatedFiles.length });

        } catch (error) {
            console.error(error);
            alert("Generation Failed");
        } finally {
            setGenerating(false);
        }
    };

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="min-h-screen bg-[var(--stitch-background)] flex flex-col">
            {/* Header */}
            <header className="bg-[var(--stitch-surface)] border-b border-[var(--stitch-border)] h-16 flex items-center px-6 justify-between sticky top-0 z-50">
                <StitchFlex className="gap-4">
                    <StitchButton variant="ghost" size="sm" onClick={() => navigate(-1)}>Exit</StitchButton>
                    <div className="h-6 w-px bg-[var(--stitch-border)] mx-2" />
                    <h1 className="font-semibold text-lg text-[var(--stitch-text-primary)]">Bulk Create</h1>
                </StitchFlex>
                <div className="flex items-center gap-2">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${index === currentStep ? 'bg-[var(--stitch-primary-light)] text-[var(--stitch-primary)]' :
                                    index < currentStep ? 'text-[var(--stitch-success)]' : 'text-[var(--stitch-text-tertiary)]'
                                }`}>
                                <step.icon size={16} />
                                <span className={`text-sm font-medium ${index !== currentStep && 'hidden md:inline'}`}>{step.title}</span>
                            </div>
                            {index < steps.length - 1 && <ChevronRight size={14} className="text-[var(--stitch-text-tertiary)] mx-1" />}
                        </div>
                    ))}
                </div>
                <div className="w-24" />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 flex justify-center">
                <StitchContainer className="max-w-5xl w-full">
                    {/* Step 1: Data Source */}
                    {currentStep === 0 && (
                        <StitchCard className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
                            <div className="mb-6">
                                <FileSpreadsheet size={48} className="text-[var(--stitch-primary)] mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Upload your data</h3>
                                <p className="text-[var(--stitch-text-secondary)]">Supports CSV and Excel files</p>
                            </div>

                            {!excelData ? (
                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileUpload}
                                    />
                                    <label htmlFor="file-upload">
                                        <StitchButton size="lg" as="span" className="cursor-pointer">
                                            <Upload className="mr-2" size={18} /> Select File
                                        </StitchButton>
                                    </label>
                                </div>
                            ) : (
                                <div className="bg-[var(--stitch-surface-elevated)] p-6 rounded-xl border border-[var(--stitch-success)] text-left w-full max-w-md">
                                    <StitchFlex className="mb-2">
                                        <CheckCircle2 className="text-[var(--stitch-success)] mr-2" />
                                        <span className="font-bold">File Loaded Successfully</span>
                                    </StitchFlex>
                                    <p className="text-sm text-[var(--stitch-text-secondary)] mb-4">{excelData.totalRows} rows detected</p>
                                    <StitchButton variant="secondary" size="sm" onClick={() => loadExcelFile(null as any)}>Change File</StitchButton>
                                </div>
                            )}
                        </StitchCard>
                    )}

                    {/* Step 2: Mapping */}
                    {currentStep === 1 && (
                        <StitchCard className="p-8">
                            <StitchFlex justify="between" className="mb-6">
                                <h3 className="text-lg font-bold">Map Columns to Elements</h3>
                                <StitchButton size="sm" variant="secondary" onClick={() => autoMapPlaceholders()}>Auto Map</StitchButton>
                            </StitchFlex>

                            <div className="space-y-4">
                                {Object.keys(mappings).map(placeholder => (
                                    <div key={placeholder} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center p-4 bg-[var(--stitch-background)] rounded-lg border border-[var(--stitch-border)]">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-[var(--stitch-primary-light)] text-[var(--stitch-primary)] px-2 py-1 rounded text-sm font-mono">
                                                {`{{${placeholder}}}`}
                                            </span>
                                        </div>
                                        <ArrowRight size={16} className="text-[var(--stitch-text-tertiary)]" />
                                        <select
                                            className="p-2 rounded border border-[var(--stitch-border)] bg-white w-full"
                                            value={mappings[placeholder] || ''}
                                            onChange={(e) => useDataStore.getState().mapPlaceholderToColumn(placeholder, e.target.value)}
                                        >
                                            <option value="">-- Select Column --</option>
                                            {excelData?.columns.map(col => (
                                                <option key={col.name} value={col.name}>{col.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                                {Object.keys(mappings).length === 0 && (
                                    <div className="text-center py-12 text-[var(--stitch-text-tertiary)]">
                                        <AlertCircle size={32} className="mx-auto mb-2" />
                                        <p>No text elements with placeholders (e.g., {"{{Name}}"}) found in your design.</p>
                                    </div>
                                )}
                            </div>
                        </StitchCard>
                    )}

                    {/* Step 3: Settings */}
                    {currentStep === 2 && (
                        <StitchGrid cols={2} className="gap-6">
                            <StitchCard className="p-6">
                                <h3 className="font-bold mb-4">Output Format</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">File Type</label>
                                        <select
                                            className="w-full p-2 rounded border border-[var(--stitch-border)]"
                                            value={config.fileFormat}
                                            onChange={(e) => setConfig({ ...config, fileFormat: e.target.value })}
                                        >
                                            <option value="pdf">PDF Document</option>
                                            <option value="png">PNG Images</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Naming Pattern</label>
                                        <StitchInput
                                            value={config.namingPattern}
                                            onChange={(e) => setConfig({ ...config, namingPattern: e.target.value })}
                                        />
                                        <p className="text-xs text-[var(--stitch-text-tertiary)] mt-1">Use columns like {"{{Name}}"} in filename.</p>
                                    </div>
                                </div>
                            </StitchCard>
                            <StitchCard className="p-6">
                                <h3 className="font-bold mb-4">Batch Settings</h3>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Batch Name (Folder/Zip)</label>
                                    <StitchInput
                                        value={config.batchName}
                                        onChange={(e) => setConfig({ ...config, batchName: e.target.value })}
                                    />
                                </div>
                            </StitchCard>
                        </StitchGrid>
                    )}

                    {/* Step 4: Generate */}
                    {currentStep === 3 && (
                        <div className="text-center max-w-md mx-auto">
                            {!generationResults ? (
                                <StitchCard className="p-8">
                                    <h3 className="text-xl font-bold mb-4">Ready to Generate</h3>
                                    <p className="mb-6 text-[var(--stitch-text-secondary)]">
                                        You are about to generate <strong>{excelData?.totalRows}</strong> documents.
                                    </p>

                                    {generating ? (
                                        <div className="space-y-4">
                                            <div className="w-full bg-[var(--stitch-background)] h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[var(--stitch-primary)] h-full transition-all duration-300"
                                                    style={{ width: `${generationProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-sm font-medium text-[var(--stitch-primary)]">Processing... {generationProgress}%</p>
                                        </div>
                                    ) : (
                                        <StitchButton size="lg" className="w-full" onClick={startGeneration}>
                                            <CheckCircle2 className="mr-2" size={20} /> Start Generation
                                        </StitchButton>
                                    )}
                                </StitchCard>
                            ) : (
                                <StitchCard className="p-8 bg-green-50 border-green-200">
                                    <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-green-800 mb-2">Generation Complete!</h3>
                                    <p className="text-green-700 mb-6">Successfully created {generationResults.count} files.</p>
                                    <StitchButton onClick={() => navigate('/dashboard')}>Back to Dashboard</StitchButton>
                                </StitchCard>
                            )}
                        </div>
                    )}

                </StitchContainer>
            </main>

            {/* Footer */}
            {!generationResults && (
                <footer className="bg-[var(--stitch-surface)] border-t border-[var(--stitch-border)] h-20 flex items-center px-8 justify-between">
                    <StitchButton variant="secondary" onClick={handleBack} disabled={generating}>
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </StitchButton>

                    {currentStep !== 3 && (
                        <StitchButton size="lg" onClick={handleNext} disabled={!excelData}>
                            Continue <ChevronRight size={18} className="ml-2" />
                        </StitchButton>
                    )}
                </footer>
            )}
        </div>
    );
};

export default BulkGenerateScreen;
