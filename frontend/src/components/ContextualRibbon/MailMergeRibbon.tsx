import React, { useState, useRef, useEffect } from 'react';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { useUIStore } from '../../store/uiStore';
import {
    Type, Image, GitBranch, List, Database, RefreshCw, Eye, EyeOff,
    ChevronLeft, ChevronRight, SkipBack, SkipForward,
    Filter, Zap, Download, Settings, HelpCircle, FileText,
    ChevronDown, Search, AlertTriangle, CheckCircle2
} from 'lucide-react';
import './MailMergeRibbon.css';

// ── Dropdown button helper ──────────────────────────────

interface DropdownItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    divider?: boolean;
    disabled?: boolean;
}

const RibbonDropdown: React.FC<{
    label: string;
    icon: React.ReactNode;
    items: DropdownItem[];
    variant?: 'default' | 'primary' | 'success';
}> = ({ label, icon, items, variant = 'default' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={`mm-ribbon-dropdown ${variant}`} ref={ref}>
            <button className="mm-ribbon-btn" onClick={() => setOpen(!open)}>
                {icon}
                <span>{label}</span>
                <ChevronDown size={10} className={`mm-ribbon-chevron ${open ? 'open' : ''}`} />
            </button>
            {open && (
                <div className="mm-ribbon-dropdown-menu">
                    {items.map((item, i) => (
                        item.divider ? <div key={i} className="mm-ribbon-divider" /> : (
                            <button
                                key={i}
                                onClick={() => { item.onClick(); setOpen(false); }}
                                disabled={item.disabled}
                                className="mm-ribbon-dropdown-item"
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main Ribbon ─────────────────────────────────────────

export const MailMergeRibbon: React.FC = () => {
    const {
        dataSource, isPreviewMode, previewRecordIndex, filteredRows, fields,
        togglePreviewMode, nextRecord, prevRecord, firstRecord, lastRecord,
        refreshDataSource, viewSettings, toggleViewSetting
    } = useMailMergeStore();
    const { openModal } = useUIStore();

    const hasData = !!dataSource;

    return (
        <div className="mm-ribbon">
            {/* Group 1: Insert Fields */}
            <div className="mm-ribbon-group">
                <span className="mm-ribbon-group-label">Insert</span>
                <div className="mm-ribbon-buttons">
                    <RibbonDropdown
                        label="Text Field"
                        icon={<Type size={14} />}
                        items={[
                            { label: 'Insert Text Placeholder', icon: <Type size={12} />, onClick: () => { } },
                            ...(hasData ? fields.filter(f => f.type === 'text').slice(0, 8).map(f => ({
                                label: `{{${f.name}}}`,
                                onClick: () => { },
                            })) : []),
                        ]}
                    />
                    <RibbonDropdown
                        label="Image Field"
                        icon={<Image size={14} />}
                        items={[
                            { label: 'Insert Image Placeholder', icon: <Image size={12} />, onClick: () => { } },
                            ...(hasData ? fields.filter(f => f.type === 'image').slice(0, 5).map(f => ({
                                label: `{{${f.name}}}`,
                                onClick: () => { },
                            })) : []),
                        ]}
                    />
                    <button className="mm-ribbon-btn" title="Insert Condition Block">
                        <GitBranch size={14} />
                        <span>Condition</span>
                    </button>
                    <button className="mm-ribbon-btn" title="Insert Dynamic List">
                        <List size={14} />
                        <span>List</span>
                    </button>
                </div>
            </div>

            <div className="mm-ribbon-separator" />

            {/* Group 2: Data Source & Preview */}
            <div className="mm-ribbon-group">
                <span className="mm-ribbon-group-label">Data</span>
                <div className="mm-ribbon-buttons">
                    <RibbonDropdown
                        label={hasData ? dataSource.name : 'Connect'}
                        icon={<Database size={14} />}
                        items={[
                            { label: hasData ? 'Change Data Source' : 'Connect Data Source', icon: <Database size={12} />, onClick: () => openModal('dataSourceConnection') },
                            ...(hasData ? [
                                { label: 'Refresh Data', icon: <RefreshCw size={12} />, onClick: () => refreshDataSource() },
                                { label: 'Filter & Sort', icon: <Filter size={12} />, onClick: () => openModal('dataFilterSort') },
                            ] : []),
                        ]}
                    />
                    {hasData && (
                        <button
                            className="mm-ribbon-btn"
                            onClick={() => refreshDataSource()}
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mm-ribbon-separator" />

            {/* Group 3: Preview */}
            {hasData && (
                <>
                    <div className="mm-ribbon-group">
                        <span className="mm-ribbon-group-label">Preview</span>
                        <div className="mm-ribbon-buttons">
                            <button
                                className={`mm-ribbon-btn ${isPreviewMode ? 'active' : ''}`}
                                onClick={togglePreviewMode}
                                title={isPreviewMode ? 'Show Placeholders' : 'Preview Data'}
                            >
                                {isPreviewMode ? <Eye size={14} /> : <EyeOff size={14} />}
                                <span>{isPreviewMode ? 'Live' : 'Off'}</span>
                            </button>

                            {/* Record navigation */}
                            <div className="mm-ribbon-nav">
                                <button className="mm-ribbon-nav-btn" onClick={firstRecord} disabled={previewRecordIndex === 0}>
                                    <SkipBack size={11} />
                                </button>
                                <button className="mm-ribbon-nav-btn" onClick={prevRecord} disabled={previewRecordIndex === 0}>
                                    <ChevronLeft size={13} />
                                </button>
                                <span className="mm-ribbon-counter">
                                    {previewRecordIndex + 1} / {filteredRows.length}
                                </span>
                                <button className="mm-ribbon-nav-btn" onClick={nextRecord} disabled={previewRecordIndex >= filteredRows.length - 1}>
                                    <ChevronRight size={13} />
                                </button>
                                <button className="mm-ribbon-nav-btn" onClick={lastRecord} disabled={previewRecordIndex >= filteredRows.length - 1}>
                                    <SkipForward size={11} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mm-ribbon-separator" />
                </>
            )}

            {/* Group 4: Conditions */}
            <div className="mm-ribbon-group">
                <span className="mm-ribbon-group-label">Conditions</span>
                <div className="mm-ribbon-buttons">
                    <button className="mm-ribbon-btn" onClick={() => openModal('conditionBuilder')}>
                        <GitBranch size={14} />
                        <span>New Rule</span>
                    </button>
                </div>
            </div>

            <div className="mm-ribbon-separator" />

            {/* Group 5: Generate */}
            <div className="mm-ribbon-group">
                <span className="mm-ribbon-group-label">Generate</span>
                <div className="mm-ribbon-buttons">
                    <RibbonDropdown
                        label="Generate"
                        icon={<Zap size={14} />}
                        variant="success"
                        items={[
                            { label: 'Generate All', icon: <Zap size={12} />, onClick: () => openModal('batchGeneration'), disabled: !hasData },
                            { label: 'Generate Filtered', icon: <Filter size={12} />, onClick: () => openModal('batchGeneration'), disabled: !hasData || filteredRows.length === dataSource.rowCount },
                            { divider: true, label: '', onClick: () => { } },
                            { label: 'Export Settings', icon: <Settings size={12} />, onClick: () => openModal('exportSettings') },
                        ]}
                    />
                </div>
            </div>

            <div className="mm-ribbon-separator" />

            {/* Group 6: Display Options */}
            <div className="mm-ribbon-group">
                <span className="mm-ribbon-group-label">View</span>
                <div className="mm-ribbon-buttons">
                    <button
                        className={`mm-ribbon-btn ${viewSettings.showGuides ? 'active' : ''}`}
                        title="Toggle Guides"
                        onClick={() => toggleViewSetting('showGuides')}
                    >
                        <CheckCircle2 size={14} className="visible-icon" />
                        <span>Guides</span>
                    </button>
                    <button
                        className={`mm-ribbon-btn ${viewSettings.showFieldHighlights ? 'active' : ''}`}
                        title="Toggle Placeholders"
                        onClick={() => toggleViewSetting('showFieldHighlights')}
                    >
                        <CheckCircle2 size={14} className="visible-icon" />
                        <span>Fields</span>
                    </button>
                </div>
            </div>

            <div className="mm-ribbon-separator" />

            {/* Group 7: Utilities */}
            <div className="mm-ribbon-group">
                <span className="mm-ribbon-group-label">Tools</span>
                <div className="mm-ribbon-buttons">
                    <button className="mm-ribbon-btn" onClick={() => openModal('dataFilterSort')} disabled={!hasData} title="Filter & Sort">
                        <Filter size={14} />
                    </button>
                    <button className="mm-ribbon-btn" onClick={() => openModal('validationReport')} title="Validation Report">
                        <AlertTriangle size={14} />
                    </button>
                    <button className="mm-ribbon-btn" title="Help">
                        <HelpCircle size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
