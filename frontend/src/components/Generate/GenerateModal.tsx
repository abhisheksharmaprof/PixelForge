import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useTemplateStore, Template } from '../../store/templateStore';
import { useDataStore } from '../../store/dataStore';
import { Modal } from '../Shared/Modal';
import { Button } from '../Shared/Button';
import { Input } from '../Shared/Input';
import { Dropdown } from '../Shared/Dropdown';
import { Checkbox } from '../Shared/Checkbox';
import {
    FaFileAlt,
    FaDatabase,
    FaLink,
    FaCog,
    FaEye,
    FaRocket,
    FaCheckCircle,
    FaSpinner,
    FaUpload,
    FaFileExcel,
} from 'react-icons/fa';
import {
    generatePDF,
    generateMultiPagePDF,
    generateWord,
    downloadAsZip,
    downloadFile,
    sanitizeFilename,
    getExtension,
    GeneratedFile,
} from '../../utils/exportService';
import './GenerateModal.css';

interface GenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { canvas } = useCanvasStore();
    const { currentTemplate, savedTemplates, setCurrentTemplate, loadTemplates } = useTemplateStore();
    const { excelData, mappings, validateMappings, loadExcelFile } = useDataStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationResults, setGenerationResults] = useState<any>(null);

    // Load templates when modal opens
    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen, loadTemplates]);

    // Generation configuration
    const [config, setConfig] = useState({
        // Step 1: Template Selection (already selected)
        templateId: currentTemplate?.id || '',
        templateName: currentTemplate?.name || '',

        // Step 2: Data Source
        dataSource: 'excel',

        // Step 3: Placeholder Mapping (already done)
        mappingsValid: false,

        // Step 4: Output Settings
        fileFormat: 'pdf',
        pageSize: 'A4',
        orientation: 'portrait',
        dpi: 300,
        quality: 'high',

        // Step 5: File Naming
        namingPattern: 'Document_{{Name}}_{{ID}}',
        outputFolder: 'GeneratedDocuments',
        batchName: `Batch_${new Date().toISOString().split('T')[0]}`,

        // Step 6: Row Selection
        rowSelection: 'all',
        startRow: 0,
        endRow: excelData?.totalRows || 0,
        selectedRows: [] as number[],

        // Step 7: Advanced Options
        stopOnError: false,
        skipEmptyRows: true,
        createSubfolders: false,
        generateZip: false,
    });

    const steps = [
        { title: 'Template', icon: <FaFileAlt /> },
        { title: 'Data Source', icon: <FaDatabase /> },
        { title: 'Mapping', icon: <FaLink /> },
        { title: 'Output Settings', icon: <FaCog /> },
        { title: 'Preview', icon: <FaEye /> },
        { title: 'Generate', icon: <FaRocket /> },
    ];

    // Validate current step
    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return !!currentTemplate;
            case 1:
                return !!excelData;
            case 2:
                return validateMappings();
            case 3:
                return true;
            case 4:
                return true;
            case 5:
                return true;
            default:
                return false;
        }
    };

    // Start generation
    const startGeneration = async () => {
        if (!canvas || !excelData) return;

        setGenerating(true);
        setGenerationProgress(0);

        try {
            // Prepare row indices
            let rowIndices: number[] = [];

            if (config.rowSelection === 'all') {
                rowIndices = Array.from({ length: excelData.totalRows }, (_, i) => i);
            } else if (config.rowSelection === 'range') {
                rowIndices = Array.from(
                    { length: config.endRow - config.startRow },
                    (_, i) => config.startRow + i
                );
            } else {
                rowIndices = config.selectedRows;
            }

            const generatedFiles: GeneratedFile[] = [];
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const templateJSON = canvas.toJSON();

            // Process each row
            for (let i = 0; i < rowIndices.length; i++) {
                const rowIndex = rowIndices[i];
                const row = excelData.rows[rowIndex];

                // Update progress
                setGenerationProgress(Math.round(((i + 1) / rowIndices.length) * 100));

                // Create temporary canvas for this row
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvasWidth;
                tempCanvas.height = canvasHeight;

                const fabricTempCanvas = new fabric.Canvas(tempCanvas, {
                    width: canvasWidth,
                    height: canvasHeight,
                });

                // Load template and substitute placeholders
                await new Promise<void>((resolve) => {
                    fabricTempCanvas.loadFromJSON(templateJSON, () => {
                        // Substitute placeholders
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

                            // Handle image placeholders
                            if (obj.isPlaceholder && obj.placeholderType === 'image') {
                                const columnName = mappings[obj.placeholderName];
                                const imageUrl = columnName && row[columnName];
                                // Image substitution is async and complex, skip for now
                            }
                        });
                        fabricTempCanvas.renderAll();
                        resolve();
                    });
                });

                // Generate file name
                let fileName = config.namingPattern;
                const placeholderRegex = /\{\{([^}]+)\}\}/g;
                fileName = fileName.replace(placeholderRegex, (match: string, placeholder: string) => {
                    const columnName = mappings[placeholder] || placeholder;
                    const value = row[columnName];
                    return value !== undefined ? sanitizeFilename(String(value)) : placeholder;
                });

                // Fallback if name is empty
                if (!fileName.trim()) {
                    fileName = `Document_${rowIndex + 1}`;
                }

                // Export to image
                const dataUrl = fabricTempCanvas.toDataURL({
                    format: 'png',
                    quality: 1,
                    multiplier: config.dpi / 72,
                });

                // Generate file based on format
                let blob: Blob;
                const extension = getExtension(config.fileFormat as 'pdf' | 'word');

                if (config.fileFormat === 'pdf') {
                    blob = await generatePDF(dataUrl, canvasWidth, canvasHeight, fileName);
                } else if (config.fileFormat === 'word') {
                    blob = await generateWord(fabricTempCanvas, canvasWidth, canvasHeight, fileName);
                } else if (config.fileFormat === 'png') {
                    // Convert data URL to blob
                    const response = await fetch(dataUrl);
                    blob = await response.blob();
                } else {
                    // JPEG
                    const jpegDataUrl = fabricTempCanvas.toDataURL({
                        format: 'jpeg',
                        quality: 0.9,
                        multiplier: config.dpi / 72,
                    });
                    const response = await fetch(jpegDataUrl);
                    blob = await response.blob();
                }

                generatedFiles.push({
                    name: `${fileName}${extension || (config.fileFormat === 'png' ? '.png' : '.jpg')}`,
                    blob,
                });

                // Cleanup
                fabricTempCanvas.dispose();
            }

            // Handle duplicate filenames by adding _1, _2, etc.
            const fileNameCounts: Record<string, number> = {};
            const finalFiles = generatedFiles.map(file => {
                const baseName = file.name;
                if (fileNameCounts[baseName] !== undefined) {
                    fileNameCounts[baseName]++;
                    const ext = baseName.lastIndexOf('.');
                    const name = ext > 0 ? baseName.slice(0, ext) : baseName;
                    const extension = ext > 0 ? baseName.slice(ext) : '';
                    return { ...file, name: `${name}_${fileNameCounts[baseName]}${extension}` };
                } else {
                    fileNameCounts[baseName] = 0;
                    return file;
                }
            });

            // Download files
            if (finalFiles.length === 1) {
                downloadFile(finalFiles[0].blob, finalFiles[0].name);
            } else {
                await downloadAsZip(finalFiles, `${config.batchName}.zip`);
            }

            setGenerationResults({
                success: true,
                successful: finalFiles.length,
                failed: 0,
                total: finalFiles.length,
                files: finalFiles.map(f => f.name),
                outputPath: 'Downloads folder',
            });
            setCurrentStep(currentStep + 1); // Move to results step

        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate documents. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderTemplateStep();
            case 1:
                return renderDataSourceStep();
            case 2:
                return renderMappingStep();
            case 3:
                return renderOutputSettingsStep();
            case 4:
                return renderPreviewStep();
            case 5:
                return renderGenerateStep();
            case 6:
                return renderResultsStep();
            default:
                return null;
        }
    };

    // Template search and filter state
    const [templateSearch, setTemplateSearch] = useState('');
    const [showAllTemplates, setShowAllTemplates] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Get unique categories from templates
    const categories = React.useMemo(() => {
        const cats = new Set<string>();
        savedTemplates?.forEach((t: Template) => {
            if (t.category) cats.add(t.category);
        });
        return ['all', ...Array.from(cats)];
    }, [savedTemplates]);

    // Filter templates by search and category
    const filteredTemplates = React.useMemo(() => {
        if (!savedTemplates) return [];
        return savedTemplates.filter((t: Template) => {
            const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [savedTemplates, templateSearch, selectedCategory]);

    const displayedTemplates = showAllTemplates ? filteredTemplates : filteredTemplates.slice(0, 6);

    // Step 0: Template
    const renderTemplateStep = () => (
        <div className="step-content template-step">
            <h3>Select Template</h3>

            {currentTemplate && (
                <div className="current-template-section">
                    <h4>Currently Selected:</h4>
                    <div className="template-preview selected">
                        <img
                            src={currentTemplate.thumbnail}
                            alt={currentTemplate.name}
                            className="template-thumbnail"
                        />
                        <div className="template-info">
                            <h4>{currentTemplate.name}</h4>
                            <p className="template-category">{currentTemplate.category}</p>
                        </div>
                    </div>
                </div>
            )}

            {savedTemplates && savedTemplates.length > 0 && (
                <div className="template-library-section">
                    <h4>Or choose from Library:</h4>

                    {/* Search Input */}
                    <div className="template-search">
                        <Input
                            type="text"
                            placeholder="🔍 Search templates by name..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                        />
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="category-tabs">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat === 'all' ? 'All' : cat}
                            </button>
                        ))}
                        <button
                            className="category-tab add-category"
                            onClick={() => setShowNewCategoryInput(true)}
                        >
                            + New
                        </button>
                    </div>

                    {/* New Category Input */}
                    {showNewCategoryInput && (
                        <div className="new-category-form">
                            <Input
                                type="text"
                                placeholder="Enter category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <Button
                                variant="primary"
                                size="small"
                                onClick={() => {
                                    if (newCategoryName.trim()) {
                                        setSelectedCategory(newCategoryName.trim());
                                        setNewCategoryName('');
                                        setShowNewCategoryInput(false);
                                    }
                                }}
                            >
                                Add
                            </Button>
                            <Button
                                variant="outline"
                                size="small"
                                onClick={() => {
                                    setShowNewCategoryInput(false);
                                    setNewCategoryName('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    {/* Template Grid */}
                    <div className={`template-library-grid ${showAllTemplates ? 'expanded' : ''}`}>
                        {displayedTemplates.map((template) => (
                            <div
                                key={template.id}
                                className={`template-card ${currentTemplate?.id === template.id ? 'active' : ''}`}
                                onClick={() => setCurrentTemplate(template)}
                            >
                                <img
                                    src={template.thumbnail || '/placeholder-template.png'}
                                    alt={template.name}
                                    className="template-card-thumb"
                                />
                                <span className="template-card-name">{template.name}</span>
                                <span className="template-card-category">{template.category}</span>
                            </div>
                        ))}
                    </div>

                    {/* View More / View Less Toggle */}
                    {filteredTemplates.length > 6 && (
                        <button
                            className="view-all-btn"
                            onClick={() => setShowAllTemplates(!showAllTemplates)}
                        >
                            {showAllTemplates
                                ? '↑ Show Less'
                                : `↓ View All (${filteredTemplates.length} templates)`
                            }
                        </button>
                    )}

                    {filteredTemplates.length === 0 && (
                        <p className="no-results">No templates match your search.</p>
                    )}
                </div>
            )}

            {!currentTemplate && (!savedTemplates || savedTemplates.length === 0) && (
                <div className="no-template">
                    <p>No template selected. Please create or open a template first.</p>
                </div>
            )}
        </div>
    );

    // Step 1: Data Source
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && loadExcelFile) {
            await loadExcelFile(file);
        }
    };

    const renderDataSourceStep = () => (
        <div className="step-content data-source-step">
            <h3>Data Source</h3>

            {/* File Upload Zone */}
            <div className="upload-zone">
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    id="excel-upload-modal"
                    style={{ display: 'none' }}
                />
                <label htmlFor="excel-upload-modal" className="upload-label">
                    <FaUpload size={24} />
                    <span>Upload Excel or CSV File</span>
                    <small>Click to browse or drag and drop</small>
                </label>
            </div>

            {excelData ? (
                <div className="data-info">
                    <div className="data-file-info success">
                        <FaFileExcel size={32} color="#10b981" />
                        <div>
                            <h4>Data Loaded Successfully</h4>
                            <p>{excelData.totalRows} rows × {excelData.totalColumns} columns</p>
                        </div>
                    </div>

                    <div className="data-preview">
                        <h4>Columns:</h4>
                        <div className="columns-list">
                            {excelData.columns.map((col, index) => (
                                <div key={index} className="column-chip">
                                    {col.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-data-hint">
                    <p>📊 Upload a file above or load data from the Data tab in the sidebar.</p>
                </div>
            )}
        </div>
    );

    // Step 2: Mapping
    const renderMappingStep = () => {
        const mappingsValid = validateMappings();
        const totalPlaceholders = Object.keys(mappings).length;
        const mappedPlaceholders = Object.values(mappings).filter(v => v).length;

        return (
            <div className="step-content mapping-step">
                <h3>Placeholder Mapping</h3>

                <div className="mapping-status">
                    {mappingsValid ? (
                        <div className="status-success">
                            <FaCheckCircle size={32} />
                            <p>All placeholders are correctly mapped!</p>
                        </div>
                    ) : (
                        <div className="status-warning">
                            <p>Some placeholders are not mapped.</p>
                            <p>Please map all placeholders before generating.</p>
                        </div>
                    )}

                    <div className="mapping-stats">
                        <div className="stat">
                            <span className="stat-value">{mappedPlaceholders}</span>
                            <span className="stat-label">Mapped</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{totalPlaceholders - mappedPlaceholders}</span>
                            <span className="stat-label">Unmapped</span>
                        </div>
                    </div>
                </div>

                <div className="mappings-list">
                    {Object.entries(mappings).map(([placeholder, column]) => (
                        <div key={placeholder} className="mapping-row">
                            <span className="placeholder-name">{`{{${placeholder}}}`}</span>
                            <span className="arrow">→</span>
                            <span className={`column-name ${column ? 'mapped' : 'unmapped'}`}>
                                {column || 'Not mapped'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Step 3: Output Settings
    const renderOutputSettingsStep = () => (
        <div className="step-content output-settings-step">
            <h3>Output Settings</h3>

            <div className="form-section">
                <h4>File Format</h4>
                <Dropdown
                    value={config.fileFormat}
                    onChange={(value) => setConfig({ ...config, fileFormat: value as 'pdf' | 'word' | 'png' | 'jpeg' })}
                    options={[
                        { label: 'PDF', value: 'pdf' },
                        { label: 'Word (.docx)', value: 'word' },
                        { label: 'PNG Image', value: 'png' },
                        { label: 'JPEG Image', value: 'jpeg' },
                    ]}
                />
            </div>

            <div className="form-section">
                <h4>Page Size</h4>
                <Dropdown
                    value={config.pageSize}
                    onChange={(value) => setConfig({ ...config, pageSize: value as string })}
                    options={[
                        { label: 'A4 (210 × 297 mm)', value: 'A4' },
                        { label: 'Letter (8.5 × 11 in)', value: 'Letter' },
                        { label: 'Legal (8.5 × 14 in)', value: 'Legal' },
                        { label: 'A3 (297 × 420 mm)', value: 'A3' },
                        { label: 'A5 (148 × 210 mm)', value: 'A5' },
                        { label: 'Custom', value: 'custom' },
                    ]}
                />
            </div>

            <div className="form-section">
                <h4>Orientation</h4>
                <div className="button-group">
                    <Button
                        variant={config.orientation === 'portrait' ? 'primary' : 'outline'}
                        onClick={() => setConfig({ ...config, orientation: 'portrait' })}
                    >
                        Portrait
                    </Button>
                    <Button
                        variant={config.orientation === 'landscape' ? 'primary' : 'outline'}
                        onClick={() => setConfig({ ...config, orientation: 'landscape' })}
                    >
                        Landscape
                    </Button>
                </div>
            </div>

            <div className="form-section">
                <h4>Quality</h4>
                <Dropdown
                    value={config.dpi}
                    onChange={(value) => setConfig({ ...config, dpi: Number(value) })}
                    options={[
                        { label: 'Screen (72 DPI)', value: 72 },
                        { label: 'Standard (150 DPI)', value: 150 },
                        { label: 'High (300 DPI)', value: 300 },
                        { label: 'Print (600 DPI)', value: 600 },
                    ]}
                />
            </div>

            <div className="form-section">
                <h4>File Naming Pattern</h4>
                <Input
                    type="text"
                    value={config.namingPattern}
                    onChange={(e) => setConfig({ ...config, namingPattern: e.target.value })}
                    placeholder="e.g., Certificate_{{Name}}"
                />
                <small>Click placeholders below to add them to the naming pattern:</small>
                <div className="placeholder-chips">
                    {Object.keys(mappings).length > 0 ? (
                        Object.keys(mappings).map((placeholder) => (
                            <button
                                key={placeholder}
                                className="placeholder-chip"
                                onClick={() => setConfig({
                                    ...config,
                                    namingPattern: config.namingPattern + `{{${placeholder}}}`
                                })}
                                type="button"
                            >
                                {`{{${placeholder}}}`}
                            </button>
                        ))
                    ) : (
                        <span className="no-placeholders">No placeholders detected in template</span>
                    )}
                </div>
            </div>

            <div className="form-section">
                <h4>Output Folder</h4>
                <Input
                    type="text"
                    value={config.batchName}
                    onChange={(e) => setConfig({ ...config, batchName: e.target.value })}
                    placeholder="Batch folder name"
                />
            </div>

            <div className="form-section">
                <h4>Advanced Options</h4>
                <div className="options-list">
                    <Checkbox
                        checked={config.stopOnError}
                        onChange={(checked: boolean) => setConfig({ ...config, stopOnError: checked })}
                    />
                    <Checkbox
                        label="Skip rows with empty required fields"
                        checked={config.skipEmptyRows}
                        onChange={(checked: boolean) => setConfig({ ...config, skipEmptyRows: checked })}
                    />
                    <Checkbox
                        label="Create subfolders by category"
                        checked={config.createSubfolders}
                        onChange={(checked: boolean) => setConfig({ ...config, createSubfolders: checked })}
                    />
                    <Checkbox
                        label="Generate ZIP archive of all files"
                        checked={config.generateZip}
                        onChange={(checked: boolean) => setConfig({ ...config, generateZip: checked })}
                    />
                </div>
            </div>
        </div>
    );

    // Step 4: Preview
    const renderPreviewStep = () => (
        <div className="step-content preview-step">
            <h3>Preview & Row Selection</h3>

            <div className="form-section">
                <h4>Rows to Generate</h4>
                <Dropdown
                    value={config.rowSelection}
                    onChange={(value) => setConfig({ ...config, rowSelection: value as string })}
                    options={[
                        { label: `All Rows (${excelData?.totalRows})`, value: 'all' },
                        { label: 'Specific Range', value: 'range' },
                        { label: 'Selected Rows', value: 'selected' },
                    ]}
                />
            </div>

            {config.rowSelection === 'range' && (
                <div className="form-section range-selection">
                    <div className="range-inputs">
                        <Input
                            type="number"
                            label="Start Row"
                            value={config.startRow + 1}
                            onChange={(e) =>
                                setConfig({ ...config, startRow: Number(e.target.value) - 1 })
                            }
                            min={1}
                            max={excelData?.totalRows || 1}
                        />
                        <span>to</span>
                        <Input
                            type="number"
                            label="End Row"
                            value={config.endRow}
                            onChange={(e) =>
                                setConfig({ ...config, endRow: Number(e.target.value) })
                            }
                            min={config.startRow + 1}
                            max={excelData?.totalRows || 1}
                        />
                    </div>
                    <p className="range-count">
                        Will generate {config.endRow - config.startRow} document(s)
                    </p>
                </div>
            )}

            {config.rowSelection === 'selected' && (
                <div className="form-section selected-rows">
                    <p>Select specific rows to generate:</p>
                    <div className="row-checkboxes">
                        {excelData?.rows.slice(0, 20).map((row, index) => (
                            <Checkbox
                                key={index}
                                label={`Row ${index + 1}: ${Object.values(row)[0]}`}
                                checked={config.selectedRows.includes(index)}
                                onChange={(checked: boolean) => {
                                    if (checked) {
                                        setConfig({
                                            ...config,
                                            selectedRows: [...config.selectedRows, index],
                                        });
                                    } else {
                                        setConfig({
                                            ...config,
                                            selectedRows: config.selectedRows.filter(i => i !== index),
                                        });
                                    }
                                }}
                            />
                        ))}
                    </div>
                    {excelData && excelData.totalRows > 20 && (
                        <p>Showing first 20 rows. Use range selection for more.</p>
                    )}
                </div>
            )}

            <div className="preview-samples">
                <h4>Preview (First 3 Documents)</h4>
                <div className="preview-grid">
                    {[0, 1, 2].map(index => {
                        const row = excelData?.rows[index];
                        if (!row || !canvas) {
                            return (
                                <div key={index} className="preview-card empty">
                                    <div className="preview-header">Document {index + 1}</div>
                                    <div className="preview-canvas">
                                        <p>No data</p>
                                    </div>
                                </div>
                            );
                        }

                        // Generate preview text showing substituted values
                        const previewText = Object.entries(mappings)
                            .filter(([placeholder, column]) => column)
                            .map(([placeholder, column]) => {
                                const value = row[column as string];
                                return `${placeholder}: ${value || '(empty)'}`;
                            })
                            .slice(0, 4);

                        return (
                            <div key={index} className="preview-card">
                                <div className="preview-header">Document {index + 1}</div>
                                <div className="preview-canvas">
                                    <div className="preview-data">
                                        {previewText.length > 0 ? (
                                            previewText.map((line, i) => (
                                                <div key={i} className="preview-line">{line}</div>
                                            ))
                                        ) : (
                                            <p>No mappings configured</p>
                                        )}
                                        {Object.keys(mappings).length > 4 && (
                                            <div className="preview-more">+{Object.keys(mappings).length - 4} more fields</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="generation-summary">
                <h4>Generation Summary</h4>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">Documents to Generate:</span>
                        <span className="summary-value">
                            {config.rowSelection === 'all'
                                ? excelData?.totalRows
                                : config.rowSelection === 'range'
                                    ? config.endRow - config.startRow
                                    : config.selectedRows.length}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Format:</span>
                        <span className="summary-value">{config.fileFormat.toUpperCase()}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Page Size:</span>
                        <span className="summary-value">{config.pageSize}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Quality:</span>
                        <span className="summary-value">{config.dpi} DPI</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 5: Generate
    const renderGenerateStep = () => (
        <div className="step-content generate-step">
            {!generating && !generationResults && (
                <>
                    <h3>Ready to Generate</h3>
                    <div className="ready-message">
                        <FaRocket size={64} />
                        <p>Everything is configured and ready!</p>
                        <p>Click the button below to start generating documents.</p>

                        <Button
                            variant="primary"
                            size="large"
                            onClick={startGeneration}
                        >
                            Start Generation
                        </Button>
                    </div>
                </>
            )}

            {generating && (
                <>
                    <h3>Generating Documents...</h3>
                    <div className="generation-progress">
                        <FaSpinner className="spinner" size={48} />
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${generationProgress}%` }}
                            />
                        </div>
                        <p className="progress-text">{generationProgress}% Complete</p>
                        <p className="progress-details">
                            Generating document {Math.floor(generationProgress / 100 * (excelData?.totalRows || 1))}
                            of {excelData?.totalRows}
                        </p>
                    </div>
                </>
            )}
        </div>
    );

    // Step 6: Results
    const renderResultsStep = () => (
        <div className="step-content results-step">
            <h3>Generation Complete!</h3>

            {generationResults && (
                <div className="results-summary">
                    <div className="success-icon">
                        <FaCheckCircle size={64} color="#2ECC71" />
                    </div>

                    <div className="results-stats">
                        <div className="stat-card success">
                            <span className="stat-value">{generationResults.successful}</span>
                            <span className="stat-label">Successful</span>
                        </div>
                        <div className="stat-card error">
                            <span className="stat-value">{generationResults.failed}</span>
                            <span className="stat-label">Failed</span>
                        </div>
                        <div className="stat-card total">
                            <span className="stat-value">{generationResults.total}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>

                    <div className="output-location">
                        <h4>Output Location:</h4>
                        <p className="folder-path">{generationResults.outputPath}</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Open folder in file explorer
                                window.open(generationResults.outputPath, '_blank');
                            }}
                        >
                            Open Folder
                        </Button>
                    </div>

                    {generationResults.zipFile && (
                        <div className="zip-download">
                            <h4>Download ZIP Archive:</h4>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    // Download ZIP file
                                    window.open(generationResults.zipFile, '_blank');
                                }}
                            >
                                Download All Files (ZIP)
                            </Button>
                        </div>
                    )}

                    {generationResults.errors && generationResults.errors.length > 0 && (
                        <div className="error-list">
                            <h4>Errors:</h4>
                            <ul>
                                {generationResults.errors.map((error: any, index: number) => (
                                    <li key={index}>
                                        Row {error.row}: {error.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="results-actions">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentStep(0);
                                setGenerationResults(null);
                            }}
                        >
                            Generate More
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Documents"
            width={900}
            height={700}
        >
            <div className="generate-modal">
                {/* Steps Progress */}
                <div className="steps-progress">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''
                                }`}
                            onClick={() => {
                                if (index < currentStep) {
                                    setCurrentStep(index);
                                }
                            }}
                        >
                            <div className="step-icon">{step.icon}</div>
                            <div className="step-title">{step.title}</div>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="step-content-container">
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                {currentStep < 6 && !generating && (
                    <div className="modal-footer">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (currentStep === 0) {
                                    onClose();
                                } else {
                                    setCurrentStep(currentStep - 1);
                                }
                            }}
                        >
                            {currentStep === 0 ? 'Cancel' : 'Back'}
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={!canProceed()}
                        >
                            {currentStep === 5 ? 'Finish' : 'Next'}
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
