import React, { useState } from 'react';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { useUIStore } from '../../store/uiStore';
import { FieldType } from '../../types/mailMergeTypes';
import {
    ChevronDown, Search, Star, Database, RefreshCw, X, Plus,
    Upload, Eye, EyeOff, SkipBack, SkipForward, ChevronLeft, ChevronRight,
    Shuffle, Lock, Pencil, Trash2, FileSpreadsheet, ToggleLeft, ToggleRight,
    GitBranch, Layers
} from 'lucide-react';
import './MailMergeTab.css';

// ── Field type icon + label helpers ─────────────────────

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    text: 'T',
    image: '#',
    number: '123',
    date: '📅',
    boolean: '☐',
    array: '[ ]',
};

const FIELD_TYPE_NAMES: Record<FieldType | 'all', string> = {
    all: 'All',
    text: 'Text',
    image: 'Image',
    number: 'Number',
    date: 'Date',
    boolean: 'Bool',
    array: 'Array',
};

// ── Collapsible Section component ───────────────────────

const CollapsibleSection: React.FC<{
    title: string;
    badge?: string | number;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, badge, icon, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mm-section">
            <div className="mm-section-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="mm-section-header-left">
                    {icon}
                    <span className="mm-section-title">{title}</span>
                    {badge !== undefined && <span className="mm-section-badge">{badge}</span>}
                </div>
                <ChevronDown size={14} className={`mm-section-chevron ${!isOpen ? 'collapsed' : ''}`} />
            </div>
            <div className={`mm-section-body ${!isOpen ? 'collapsed' : ''}`}>
                {children}
            </div>
        </div>
    );
};

// ── Main MailMergeTab ───────────────────────────────────

export const MailMergeTab: React.FC = () => {
    const {
        dataSource, isConnecting, fields, templateVariables, conditionalRules,
        fieldSearchQuery, fieldTypeFilter, filteredRows, previewRecordIndex, isPreviewMode,
        setFieldSearchQuery, setFieldTypeFilter, toggleFieldFavorite, incrementFieldUsage,
        disconnectDataSource, refreshDataSource,
        addTemplateVariable, deleteTemplateVariable,
        toggleConditionalRule, deleteConditionalRule,
        nextRecord, prevRecord, firstRecord, lastRecord, randomRecord, togglePreviewMode,
        getFilteredFields,
    } = useMailMergeStore();

    const { openModal } = useUIStore();
    const [addVarMode, setAddVarMode] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const [newVarType, setNewVarType] = useState<FieldType>('text');

    const displayedFields = getFilteredFields();
    const systemVars = templateVariables.filter(v => v.isSystem);
    const customVars = templateVariables.filter(v => !v.isSystem);

    // ── Drag handler for fields ──
    const handleFieldDragStart = (e: React.DragEvent, fieldName: string, fieldType: FieldType) => {
        e.dataTransfer.setData('text/plain', `{{${fieldName}}}`);
        e.dataTransfer.setData('application/mailmerge-field', fieldName);
        e.dataTransfer.setData('application/mailmerge-field-type', fieldType);
        e.dataTransfer.effectAllowed = 'copy';
    };

    // ── Add custom variable ──
    const handleAddVariable = () => {
        if (newVarName.trim()) {
            addTemplateVariable(newVarName.trim(), newVarType, '');
            setNewVarName('');
            setAddVarMode(false);
        }
    };

    return (
        <div className="mailmerge-tab">
            {/* ── Section 1: Data Source ────────────────── */}
            <CollapsibleSection
                title="Data Source"
                icon={<Database size={13} className="text-blue-500" />}
            >
                {dataSource ? (
                    <div className="mm-datasource-card">
                        <div className="mm-datasource-top">
                            <div className="mm-datasource-icon">
                                <FileSpreadsheet size={18} />
                            </div>
                            <div className="mm-datasource-info">
                                <div className="mm-datasource-name">{dataSource.name}</div>
                                <div className="mm-datasource-meta">
                                    <span className={`mm-status-badge ${dataSource.status}`}>
                                        {dataSource.status === 'connected' ? '● Connected' : dataSource.status}
                                    </span>
                                    <span>{dataSource.rowCount} rows</span>
                                </div>
                            </div>
                            <div className="mm-datasource-actions">
                                <button className="mm-icon-btn" onClick={() => refreshDataSource()} title="Refresh">
                                    <RefreshCw size={13} />
                                </button>
                                <button className="mm-icon-btn danger" onClick={disconnectDataSource} title="Disconnect">
                                    <X size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        className="mm-connect-btn"
                        onClick={() => openModal('dataSourceConnection')}
                        disabled={isConnecting}
                    >
                        <Upload size={16} />
                        {isConnecting ? 'Connecting...' : 'Connect Data Source'}
                    </button>
                )}
            </CollapsibleSection>

            {/* ── Section 2: Available Fields ──────────── */}
            <CollapsibleSection
                title="Fields"
                badge={fields.length > 0 ? fields.length : undefined}
                icon={<Layers size={13} className="text-emerald-500" />}
            >
                {fields.length > 0 ? (
                    <>
                        {/* Search */}
                        <div className="mm-field-search">
                            <Search size={13} className="mm-field-search-icon" />
                            <input
                                type="text"
                                placeholder="Search fields..."
                                value={fieldSearchQuery}
                                onChange={(e) => setFieldSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Type filter chips */}
                        <div className="mm-field-type-filters">
                            {(Object.keys(FIELD_TYPE_NAMES) as (FieldType | 'all')[]).map(type => (
                                <button
                                    key={type}
                                    className={`mm-type-chip ${fieldTypeFilter === type ? 'active' : ''}`}
                                    onClick={() => setFieldTypeFilter(type)}
                                >
                                    {FIELD_TYPE_NAMES[type]}
                                </button>
                            ))}
                        </div>

                        {/* Field list */}
                        <div className="mm-field-list">
                            {displayedFields.map(field => (
                                <div
                                    key={field.id}
                                    className="mm-field-item"
                                    draggable
                                    onDragStart={(e) => handleFieldDragStart(e, field.name, field.type)}
                                    title={`Drag to insert {{${field.name}}} • Samples: ${field.sampleValues.slice(0, 3).join(', ')}`}
                                >
                                    <div className={`mm-field-type-icon ${field.type}`}>
                                        {FIELD_TYPE_LABELS[field.type]}
                                    </div>
                                    <span className="mm-field-name">{field.name}</span>
                                    <div className="mm-field-badges">
                                        <span className="mm-field-badge">{FIELD_TYPE_NAMES[field.type]}</span>
                                        {field.usageCount > 0 && (
                                            <span className="mm-field-badge">×{field.usageCount}</span>
                                        )}
                                    </div>
                                    <div
                                        className={`mm-field-fav ${field.isFavorite ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); toggleFieldFavorite(field.id); }}
                                    >
                                        <Star size={12} fill={field.isFavorite ? '#f59e0b' : 'none'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="mm-empty-state">
                        <div className="mm-empty-icon"><Layers size={22} /></div>
                        <div className="mm-empty-title">No fields available</div>
                        <div className="mm-empty-desc">Connect a data source to see available fields.</div>
                    </div>
                )}
            </CollapsibleSection>

            {/* ── Section 3: Template Variables ─────────── */}
            <CollapsibleSection
                title="Variables"
                badge={templateVariables.length}
                icon={<span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{'{}'}</span>}
                defaultOpen={false}
            >
                {/* System variables */}
                <div className="mm-var-list">
                    {systemVars.map(v => (
                        <div key={v.id} className="mm-var-item">
                            <Lock size={11} className="text-slate-400" />
                            <span className="mm-var-name">{v.name}</span>
                            <span className="mm-var-system">System</span>
                        </div>
                    ))}
                </div>

                {/* Custom variables */}
                {customVars.length > 0 && (
                    <div className="mm-var-list" style={{ marginTop: 8 }}>
                        {customVars.map(v => (
                            <div key={v.id} className="mm-var-item">
                                <span className="mm-var-name">{v.name}</span>
                                <div className="mm-var-actions">
                                    <button className="mm-icon-btn" style={{ width: 22, height: 22 }}>
                                        <Pencil size={10} />
                                    </button>
                                    <button
                                        className="mm-icon-btn danger"
                                        style={{ width: 22, height: 22 }}
                                        onClick={() => deleteTemplateVariable(v.id)}
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add variable */}
                {addVarMode ? (
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <input
                            type="text"
                            placeholder="Variable name"
                            value={newVarName}
                            onChange={(e) => setNewVarName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
                            style={{
                                flex: 1, padding: '5px 8px', border: '1px solid #e2e8f0',
                                borderRadius: 6, fontSize: 12,
                            }}
                            autoFocus
                        />
                        <button className="mm-icon-btn" onClick={handleAddVariable} style={{ color: '#16a34a' }}>
                            <Plus size={13} />
                        </button>
                        <button className="mm-icon-btn" onClick={() => setAddVarMode(false)}>
                            <X size={13} />
                        </button>
                    </div>
                ) : (
                    <button className="mm-add-var-btn" onClick={() => setAddVarMode(true)}>
                        <Plus size={13} /> Add Custom Variable
                    </button>
                )}
            </CollapsibleSection>

            {/* ── Section 4: Conditional Rules ─────────── */}
            <CollapsibleSection
                title="Conditions"
                badge={conditionalRules.length > 0 ? conditionalRules.length : undefined}
                icon={<GitBranch size={13} className="text-amber-500" />}
                defaultOpen={false}
            >
                {conditionalRules.length > 0 ? (
                    <>
                        {conditionalRules.map(rule => (
                            <div key={rule.id} className="mm-rule-card">
                                <div className="mm-rule-header">
                                    <span className="mm-rule-name">{rule.name}</span>
                                    <button
                                        className={`mm-rule-toggle ${rule.isEnabled ? 'enabled' : 'disabled'}`}
                                        onClick={() => toggleConditionalRule(rule.id)}
                                        title={rule.isEnabled ? 'Disable' : 'Enable'}
                                    />
                                </div>
                                <div className="mm-rule-summary">
                                    {rule.conditions.length > 0
                                        ? `${rule.action === 'show' ? 'Show' : 'Hide'} if ${rule.conditions[0].field} ${rule.conditions[0].operator} "${rule.conditions[0].value}"`
                                        : 'No conditions defined'
                                    }
                                </div>
                                <div className="mm-rule-tags">
                                    <span className="mm-rule-tag conditions">{rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}</span>
                                    <span className="mm-rule-tag operator">{rule.logicOperator}</span>
                                    <span className="mm-rule-tag action">{rule.action}</span>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="mm-empty-state" style={{ padding: '16px 10px' }}>
                        <div className="mm-empty-title">No conditional rules</div>
                        <div className="mm-empty-desc">Add rules to show/hide content based on data values.</div>
                    </div>
                )}
                <button className="mm-add-rule-btn" onClick={() => openModal('conditionBuilder')}>
                    <Plus size={13} /> Add Condition Rule
                </button>
            </CollapsibleSection>

            {/* ── Section 5: Preview & Test ────────────── */}
            <CollapsibleSection
                title="Preview"
                icon={<Eye size={13} className="text-violet-500" />}
            >
                {dataSource ? (
                    <>
                        {/* Record Navigation */}
                        <div className="mm-preview-nav">
                            <button className="mm-nav-btn" onClick={firstRecord} disabled={previewRecordIndex === 0} title="First">
                                <SkipBack size={12} />
                            </button>
                            <button className="mm-nav-btn" onClick={prevRecord} disabled={previewRecordIndex === 0} title="Previous">
                                <ChevronLeft size={14} />
                            </button>
                            <span className="mm-preview-nav-text">
                                Record {previewRecordIndex + 1} of {filteredRows.length}
                            </span>
                            <button className="mm-nav-btn" onClick={nextRecord} disabled={previewRecordIndex >= filteredRows.length - 1} title="Next">
                                <ChevronRight size={14} />
                            </button>
                            <button className="mm-nav-btn" onClick={lastRecord} disabled={previewRecordIndex >= filteredRows.length - 1} title="Last">
                                <SkipForward size={12} />
                            </button>
                            <button className="mm-nav-btn" onClick={randomRecord} title="Random record">
                                <Shuffle size={12} />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="mm-preview-stats">
                            <div className="mm-stat-item">
                                <span className="mm-stat-value">{filteredRows.length}</span>
                                <span>total records</span>
                            </div>
                            <div className="mm-stat-item">
                                <span style={{ color: '#16a34a' }}>●</span>
                                <span>Ready to generate</span>
                            </div>
                        </div>

                        {/* Preview toggle */}
                        <div
                            className={`mm-preview-toggle ${isPreviewMode ? 'active' : ''}`}
                            onClick={togglePreviewMode}
                        >
                            {isPreviewMode ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span className="mm-preview-toggle-label">
                                {isPreviewMode ? 'Preview On (Live Data)' : 'Preview Off (Placeholders)'}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="mm-empty-state" style={{ padding: '16px 10px' }}>
                        <div className="mm-empty-title">No data loaded</div>
                        <div className="mm-empty-desc">Connect a data source to preview records.</div>
                    </div>
                )}
            </CollapsibleSection>
        </div>
    );
};
