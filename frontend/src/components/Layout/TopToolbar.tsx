import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useHistoryStore } from '../../store/historyStore';
import { useTemplateStore, Template } from '../../store/templateStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAutoSave } from '../../hooks/useAutoSave';
import {
    FaSave,
    FaUndo,
    FaRedo,
    FaSearchPlus,
    FaSearchMinus,
    FaPlay,
    FaCog,
    FaUser,
    FaChevronDown,
    FaDownload,
    FaShare,
    FaRocket,
} from 'react-icons/fa';
import './TopToolbar.css';

import { GenerateModal } from '../Generate/GenerateModal';
import { TopMenuBar } from './TopMenuBar';
import { SettingsModal } from '../Shared/SettingsModal';

export const TopToolbar: React.FC = () => {
    const { canvas, zoom, setZoom } = useCanvasStore();
    const { toggleFullscreen, openModal, closeModal, activeModal } = useUIStore();
    const { undo, redo, canUndo, canRedo } = useHistoryStore();
    const { currentTemplate, saveTemplate, setCurrentTemplate } = useTemplateStore();
    const { generateDefaultTemplateName, notifyOnSave, autoSaveEnabled } = useSettingsStore();

    // Initialize auto-save
    const { lastSaved, isSaving: isAutoSaving, triggerSave } = useAutoSave();

    // Page state - starts at 1 page
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isEditingZoom, setIsEditingZoom] = useState(false);
    const [zoomInputValue, setZoomInputValue] = useState(String(zoom));
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for Settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Handle save template with auto-generated names
    const handleSave = async () => {
        if (!canvas) return;

        setIsSaving(true);
        try {
            const canvasData = canvas.toJSON();

            let templateName = currentTemplate?.name;

            // Generate default name if new template (no prompt needed)
            if (!currentTemplate?.id) {
                // Use auto-generated name or let user edit it later
                templateName = generateDefaultTemplateName();
            }

            const template: Template = {
                id: currentTemplate?.id || '',
                name: templateName || generateDefaultTemplateName(),
                description: currentTemplate?.description || '',
                category: currentTemplate?.category || 'Custom',
                thumbnail: canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 }),
                data: canvasData,
                createdAt: currentTemplate?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tags: currentTemplate?.tags || [],
            };

            await saveTemplate(template);

            if (notifyOnSave) {
                showSaveNotification('Template saved!');
            }
        } catch (error) {
            console.error('Save failed:', error);
            showSaveNotification('Failed to save template', true);
        }
        setIsSaving(false);
    };

    // Show save notification
    const showSaveNotification = (message: string, isError = false) => {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${isError ? 'rgba(255, 107, 107, 0.9)' : 'rgba(0, 196, 204, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2500);
    };

    return (
        <div className="top-toolbar">
            {/* Logo & Brand */}
            <div className="toolbar-left">
                <div className="logo-area">
                    <span className="logo-icon">📄</span>
                    <span className="logo-text">CanvaWord</span>
                </div>

                {/* File Menu - Replaced by TopMenuBar */}
                <TopMenuBar />
            </div>

            {/* Center Controls */}
            {/* ... keeping center controls for quick access if desired, 
                but TopMenuBar has them too (Undo/Redo, Zoom). 
                User might want both or just Menu Bar.
                Prompt says "Top Menu Bar Component".
                Usually Menu Bar goes on top row, Toolbar on second row.
                But here we are replacing the "File Edit" buttons part.
            */}

            <div className="toolbar-center">
                {/* ... existing controls ... */}
                <div className="action-group">
                    <button
                        className={`toolbar-btn ${isSaving ? 'disabled' : ''}`}
                        onClick={handleSave}
                        disabled={isSaving}
                        title="Save (Ctrl+S)"
                    >
                        <FaSave />
                    </button>
                    <button
                        className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        <FaUndo />
                    </button>
                    <button
                        className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                    >
                        <FaRedo />
                    </button>
                </div>

                <div className="toolbar-divider" />

                {/* Zoom Controls */}
                <div className="zoom-controls">
                    <button className="toolbar-btn" onClick={() => setZoom(Math.max(zoom - 25, 25))} title="Zoom Out">
                        <FaSearchMinus />
                    </button>

                    {isEditingZoom ? (
                        <input
                            type="text"
                            className="zoom-input"
                            value={zoomInputValue}
                            onChange={(e) => setZoomInputValue(e.target.value)}
                            onBlur={() => {
                                let value = parseInt(zoomInputValue);
                                if (isNaN(value) || value < 10) value = 10;
                                if (value > 400) value = 400;
                                setZoom(value);
                                setZoomInputValue(String(value));
                                setIsEditingZoom(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                            }}
                            autoFocus
                        />
                    ) : (
                        <div
                            className="zoom-dropdown"
                            onClick={() => {
                                setZoomInputValue(String(zoom));
                                setIsEditingZoom(true);
                            }}
                        >
                            <span className="zoom-value">{zoom}%</span>
                            <FaChevronDown className="dropdown-icon" />
                        </div>
                    )}

                    <button className="toolbar-btn" onClick={() => setZoom(Math.min(zoom + 25, 400))} title="Zoom In">
                        <FaSearchPlus />
                    </button>
                </div>

                <div className="toolbar-divider" />

                {/* Page Navigation */}
                <div className="page-controls">
                    <span className="page-label">Page:</span>
                    <div className="page-info">
                        <span>{currentPage} / {totalPages}</span>
                    </div>
                    <button className="add-page-btn" onClick={() => setTotalPages(p => p + 1)} title="Add Page">
                        +
                    </button>
                </div>

                <div className="toolbar-divider" />

                <button className="preview-btn" onClick={toggleFullscreen}>
                    <FaPlay />
                    <span>Preview</span>
                </button>
            </div>

            {/* Right Actions */}
            <div className="toolbar-right">
                {/* Generate Button - Primary Action */}
                <button
                    className="generate-btn primary-action"
                    onClick={() => openModal('generate')}
                    title="Generate Documents from Data"
                >
                    <FaRocket />
                    <span>Generate</span>
                </button>

                {/* Export/Download buttons are in menu now too, but quick actions are good */}
                <button className="download-btn">
                    <FaDownload />
                    <span>Download</span>
                </button>

                <button className="share-btn">
                    <FaShare />
                    <span>Share</span>
                </button>

                <button className="avatar-btn" title="Account">
                    <FaUser />
                </button>
            </div>

            {/* Modals */}
            <GenerateModal
                isOpen={activeModal === 'generate' || isGenerateOpen}
                onClose={() => {
                    closeModal();
                    setIsGenerateOpen(false);
                }}
            />

            <SettingsModal
                isOpen={activeModal === 'settings'}
                onClose={closeModal}
            />
        </div>
    );
};
