import React, { useState } from 'react';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import {
    Type, Image, Hash, Calendar, ToggleLeft, List, ChevronDown, ChevronRight,
    GitBranch, Settings, Eye, EyeOff, Info, Link2, Palette, AlertTriangle,
    RefreshCw, Copy, Trash2, Edit3
} from 'lucide-react';
import './MailMergeProperties.css';

// ── Collapsible Section ──────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, icon, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mmp-section">
            <button className="mmp-section-header" onClick={() => setOpen(!open)}>
                <div className="mmp-section-title">
                    {icon}
                    <span>{title}</span>
                </div>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {open && <div className="mmp-section-body">{children}</div>}
        </div>
    );
};

// ── Field icon helper ────────────────────────────────────

const FieldIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 12 }) => {
    switch (type) {
        case 'text': return <Type size={size} />;
        case 'image': return <Image size={size} />;
        case 'number': return <Hash size={size} />;
        case 'date': return <Calendar size={size} />;
        case 'boolean': return <ToggleLeft size={size} />;
        case 'array': return <List size={size} />;
        default: return <Type size={size} />;
    }
};

// ── Main Properties Component ────────────────────────────

export const MailMergeProperties: React.FC = () => {
    const { selectedObjects } = useSelectionStore();
    const { fields, dataSource, isPreviewMode, updateField } = useMailMergeStore();
    const { openModal } = useUIStore();
    const { canvas } = useCanvasStore();

    const activeObject = selectedObjects[0];
    if (!activeObject) return null;

    const elementData = activeObject as any;
    const fieldBinding = elementData.fieldBinding || '';
    const boundField = fields.find(f => f.name === fieldBinding);
    const elementType = elementData.elementType || 'mailmerge-field';

    const handleFieldUpdate = (updates: Partial<typeof boundField>) => {
        if (boundField) {
            updateField(boundField.id, updates as any);
        }
    };

    const handleElementUpdate = (key: string, value: any) => {
        if (!activeObject || !canvas) return;

        if (key === 'grayscale') {
            // specialized handling for grayscale filter
            const img = activeObject as fabric.Image;
            if (img.type === 'image' || img.type === 'mailmerge-image-placeholder') {
                if (value) {
                    // Add grayscale filter if not present
                    // Note: placeholders might not have 'filters' property initialized or verifiable easily without actual image
                    // But we can set a custom property 'grayscale' to true, and BatchGenerator can check it.
                    // Standard fabric: img.filters.push(new fabric.Image.filters.Grayscale()); img.applyFilters();
                    // But for 'mailmerge-image-placeholder', it's a Rect or Group usually? 
                    // Wait, placeholders are usually Rects with image pattern or just Rects.
                    // If it's a Rect, it doesn't support filters.
                    // Changing a Rect to Grayscale doesn't make sense unless it has an image fill.
                    // The BatchGenerator REPLACES the placeholder with an Image.
                    // So we need to store the 'grayscale' preference on the placeholder OBJECT, so BatchGenerator can apply it to the generated image.
                    activeObject.set('grayscale' as any, true);
                } else {
                    activeObject.set('grayscale' as any, false);
                }
            }
        } else {
            activeObject.set(key as any, value);
        }

        canvas.renderAll();
    };

    return (
        <div className="mmp-container">
            {/* Panel Title */}
            <div className="mmp-title">
                <div className="mmp-title-info">
                    <div className="mmp-title-icon">
                        {elementType.includes('image') ? <Image size={16} /> : elementType.includes('condition') ? <GitBranch size={16} /> : <Type size={16} />}
                    </div>
                    <div>
                        <h3 className="mmp-title-text">
                            {elementType === 'mailmerge-field' ? 'Text Binding' : (elementType === 'mailmerge-image' || elementType === 'mailmerge-image-placeholder') ? 'Image Binding' : 'Condition Binding'}
                        </h3>
                        {fieldBinding && <p className="mmp-title-field">{`{{${fieldBinding}}}`}</p>}
                    </div>
                </div>
            </div>

            {/* Section A: Basic Info */}
            <Section title="Field Binding" icon={<Link2 size={14} />}>
                <div className="mmp-field-row">
                    <label className="mmp-label">Bound Field</label>
                    <select
                        className="mmp-select"
                        value={fieldBinding}
                        onChange={(e) => {
                            const newField = e.target.value;
                            // Update binding on element
                            handleElementUpdate('fieldBinding', newField);
                            // Also update text content if it's a field
                            if (elementType === 'mailmerge-field') {
                                handleElementUpdate('text', `{{${newField}}}`);
                            }
                        }}
                    >
                        <option value="">— Select Field —</option>
                        {fields.map(f => (
                            <option key={f.id} value={f.name}>{f.displayLabel || f.name}</option>
                        ))}
                    </select>
                </div>
                <div className="mmp-field-row">
                    <label className="mmp-label">Display Label</label>
                    <input
                        type="text"
                        className="mmp-input"
                        value={boundField?.displayLabel || ''}
                        onChange={(e) => handleFieldUpdate({ displayLabel: e.target.value })}
                        placeholder="Auto from field"
                    />
                </div>
                {boundField && (
                    <div className="mmp-field-meta">
                        <span className="mmp-meta-badge">
                            <FieldIcon type={boundField.type} /> {boundField.type}
                        </span>
                        <span className="mmp-meta-text">{boundField.usageCount} uses</span>
                        {boundField.sampleValues.length > 0 && (
                            <span className="mmp-meta-sample" title={boundField.sampleValues.join(', ')}>
                                Sample: {boundField.sampleValues[0]}
                            </span>
                        )}
                    </div>
                )}
            </Section>

            {/* Section B: Text / Image Formatting */}
            {(elementType === 'mailmerge-field' || !elementType.includes('condition')) && (
                <Section title="Formatting" icon={<Palette size={14} />}>
                    {boundField?.type === 'text' || !boundField ? (
                        <>
                            <div className="mmp-field-row">
                                <label className="mmp-label">Text Transform</label>
                                <select
                                    className="mmp-select"
                                    value={boundField?.textTransform || 'none'}
                                    onChange={(e) => handleFieldUpdate({ textTransform: e.target.value as any })}
                                >
                                    <option value="none">None</option>
                                    <option value="uppercase">UPPERCASE</option>
                                    <option value="lowercase">lowercase</option>
                                    <option value="capitalize">Capitalize</option>
                                    <option value="titlecase">Title Case</option>
                                </select>
                            </div>
                            <div className="mmp-field-row">
                                <label className="mmp-label">Default Value</label>
                                <input
                                    type="text"
                                    className="mmp-input"
                                    placeholder="Fallback if empty..."
                                    value={boundField?.defaultValue || ''}
                                    onChange={(e) => handleFieldUpdate({ defaultValue: e.target.value })}
                                />
                            </div>
                            <div className="mmp-field-row">
                                <label className="mmp-label">Overflow</label>
                                <select
                                    className="mmp-select"
                                    value={boundField?.overflowBehavior || 'truncate'}
                                    onChange={(e) => handleFieldUpdate({ overflowBehavior: e.target.value as any })}
                                >
                                    <option value="truncate">Truncate</option>
                                    <option value="ellipsis">Ellipsis (...)</option>
                                    <option value="shrink">Auto Shrink</option>
                                    <option value="wrap">Wrap</option>
                                    <option value="hide">Hide</option>
                                </select>
                            </div>
                        </>
                    ) : boundField?.type === 'number' ? (
                        <div className="mmp-field-row">
                            <label className="mmp-label">Number Format</label>
                            <select
                                className="mmp-select"
                                value={boundField?.numberFormat || 'auto'}
                                onChange={(e) => handleFieldUpdate({ numberFormat: e.target.value as any })}
                            >
                                <option value="auto">Auto</option>
                                <option value="integer">Integer</option>
                                <option value="2decimal">2 Decimals</option>
                                <option value="currency">Currency</option>
                                <option value="percentage">Percentage</option>
                                <option value="thousands">Thousands</option>
                            </select>
                        </div>
                    ) : boundField?.type === 'date' ? (
                        <div className="mmp-field-row">
                            <label className="mmp-label">Date Format</label>
                            <select
                                className="mmp-select"
                                value={boundField?.dateFormat || 'short'}
                                onChange={(e) => handleFieldUpdate({ dateFormat: e.target.value as any })}
                            >
                                <option value="short">Short (1/1/25)</option>
                                <option value="long">Long (January 1, 2025)</option>
                                <option value="full">Full</option>
                                <option value="iso">ISO 8601</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                    ) : boundField?.type === 'image' ? (
                        <>
                            <div className="mmp-field-row">
                                <label className="mmp-label">Image Fit</label>
                                <select
                                    className="mmp-select"
                                    value={boundField?.imageFit || 'cover'}
                                    onChange={(e) => handleFieldUpdate({ imageFit: e.target.value as any })}
                                >
                                    <option value="cover">Cover</option>
                                    <option value="contain">Contain</option>
                                    <option value="fill">Fill</option>
                                    <option value="fit">Fit</option>
                                    <option value="original">Original</option>
                                </select>
                            </div>
                            <div className="mmp-field-row">
                                <label className="mmp-label">Placeholder</label>
                                <input
                                    type="text"
                                    className="mmp-input"
                                    placeholder="URL or path..."
                                    value={boundField?.imagePlaceholder || ''}
                                    onChange={(e) => handleFieldUpdate({ imagePlaceholder: e.target.value })}
                                />
                            </div>
                        </>
                    ) : null}
                </Section>
            )}

            {/* Section B.2: Validation (Text only) */}
            {(elementType === 'mailmerge-field' && boundField?.type === 'text') && (
                <Section title="Validation" icon={<AlertTriangle size={14} />} defaultOpen={false}>
                    <div className="mmp-field-row">
                        <label className="mmp-label">Min Length</label>
                        <input
                            type="number"
                            className="mmp-input"
                            placeholder="0"
                            value={boundField.minLength || ''}
                            onChange={(e) => handleFieldUpdate({ minLength: parseInt(e.target.value) || undefined })}
                        />
                    </div>
                    <div className="mmp-field-row">
                        <label className="mmp-label">Max Length</label>
                        <input
                            type="number"
                            className="mmp-input"
                            placeholder="Unlimited"
                            value={boundField.characterLimit || ''}
                            onChange={(e) => handleFieldUpdate({ characterLimit: parseInt(e.target.value) || undefined })}
                        />
                    </div>
                    <div className="mmp-field-row">
                        <label className="mmp-label">Regex Pattern</label>
                        <input
                            type="text"
                            className="mmp-input"
                            placeholder="e.g. ^[A-Z]+$"
                            value={boundField.regexPattern || ''}
                            onChange={(e) => handleFieldUpdate({ regexPattern: e.target.value })}
                        />
                    </div>
                </Section>
            )}

            {/* Section B.3: Image Effects - Element Specific */}
            {(elementType === 'mailmerge-field' && boundField?.type === 'image') && (
                <Section title="Effects" icon={<Palette size={14} />} defaultOpen={false}>
                    <div className="mmp-field-row">
                        <label className="mmp-label">Opacity</label>
                        <div className="mmp-slider-row">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={(activeObject.opacity || 1) * 100}
                                onChange={(e) => handleElementUpdate('opacity', parseInt(e.target.value) / 100)}
                            />
                            <span>{Math.round((activeObject.opacity || 1) * 100)}%</span>
                        </div>
                    </div>
                    <div className="mmp-field-row">
                        <label className="mmp-label">Rotation</label>
                        <div className="mmp-slider-row">
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={activeObject.angle || 0}
                                onChange={(e) => handleElementUpdate('angle', parseInt(e.target.value))}
                            />
                            <span>{Math.round(activeObject.angle || 0)}°</span>
                        </div>
                    </div>
                </Section>
            )}

            {/* Section C: Conditional Logic */}
            {elementType === 'mailmerge-condition' && (
                <Section title="Condition Rules" icon={<GitBranch size={14} />}>
                    <div className="mmp-condition-info">
                        <p className="mmp-info-text">This element uses conditional logic to show/hide based on data values.</p>
                        <button className="mmp-action-btn" onClick={() => openModal('conditionBuilder')}>
                            <Edit3 size={12} /> Edit Conditions
                        </button>
                    </div>
                </Section>
            )}

            {/* Section D: Data Transformation */}
            {(elementType === 'mailmerge-field' && boundField?.type === 'text') && (
                <Section title="Data Transformation" icon={<RefreshCw size={14} />} defaultOpen={false}>
                    <div className="mmp-field-row">
                        <label className="mmp-toggle-row">
                            <span>Grayscale</span>
                            <label className="mmp-toggle">
                                <input
                                    type="checkbox"
                                    checked={!!(activeObject as any).grayscale}
                                    onChange={(e) => handleElementUpdate('grayscale', e.target.checked)}
                                />
                                <span className="mmp-toggle-slider" />
                            </label>
                        </label>
                    </div>
                    <div className="mmp-field-row">
                        <label className="mmp-toggle-row">
                            <span>Trim Whitespace</span>
                            <label className="mmp-toggle">
                                <input type="checkbox" />
                                <span className="mmp-toggle-slider" />
                            </label>
                        </label>
                    </div>
                    <div className="mmp-field-row">
                        <label className="mmp-toggle-row">
                            <span>Remove Special Chars</span>
                            <label className="mmp-toggle">
                                <input type="checkbox" />
                                <span className="mmp-toggle-slider" />
                            </label>
                        </label>
                    </div>
                    <div className="mmp-field-row">
                        <label className="mmp-label">Prefix / Suffix</label>
                        <div className="mmp-input-group">
                            <input type="text" className="mmp-input" placeholder="Prefix" />
                            <input type="text" className="mmp-input" placeholder="Suffix" />
                        </div>
                    </div>
                </Section>
            )}

            {/* Section E: Advanced Settings */}
            <Section title="Advanced" icon={<Settings size={14} />} defaultOpen={false}>
                <div className="mmp-field-row">
                    <label className="mmp-label">Visibility</label>
                    <select className="mmp-select" onChange={() => { }}>
                        <option value="always">Always Visible</option>
                        <option value="conditional">Conditional</option>
                        <option value="preview-only">Preview Only</option>
                    </select>
                </div>
                <div className="mmp-field-row">
                    <label className="mmp-label">Error Handling</label>
                    <select className="mmp-select" onChange={() => { }}>
                        <option value="show-placeholder">Show Placeholder</option>
                        <option value="hide">Hide Element</option>
                        <option value="show-error">Show Error Badge</option>
                        <option value="use-default">Use Default Value</option>
                    </select>
                </div>
                <div className="mmp-field-row">
                    <label className="mmp-label">Cache Data</label>
                    <label className="mmp-toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="mmp-toggle-slider" />
                    </label>
                </div>
            </Section>

            {/* Section F: Annotations */}
            <Section title="Annotations" icon={<Info size={14} />} defaultOpen={false}>
                <div className="mmp-field-row">
                    <label className="mmp-label">Status</label>
                    <select className="mmp-select" onChange={() => { }}>
                        <option value="draft">Draft</option>
                        <option value="review">In Review</option>
                        <option value="approved">Approved</option>
                    </select>
                </div>
                <div className="mmp-field-row">
                    <label className="mmp-label">Notes</label>
                    <textarea className="mmp-textarea" placeholder="Add notes for team..." rows={3} />
                </div>
            </Section>

            {/* Section G: Preview */}
            {isPreviewMode && boundField && (
                <Section title="Live Preview" icon={<Eye size={14} />}>
                    <div className="mmp-preview-card">
                        <p className="mmp-preview-value">
                            {dataSource?.rows[0]?.[fieldBinding] || 'No data'}
                        </p>
                        <p className="mmp-preview-label">Current record value</p>
                    </div>
                </Section>
            )}
        </div>
    );
};
