import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LeftSidebar } from '../../components/LeftSidebar/LeftSidebar';
import { CanvasWorkspace } from '../../components/Canvas/CanvasWorkspace';
import { PropertiesPanel } from '../../components/PropertiesPanel/PropertiesPanel';
import { ContextualRibbon } from '../../components/ContextualRibbon/ContextualRibbon';
import { useUIStore } from '../../store/uiStore';
import { useTemplateStore } from '../../store/templateStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useMailMergeStore } from '../../store/mailMergeStore';
import { DataPreviewModal } from '../../components/Shared/DataPreviewModal';
import { KeyboardShortcutsModal } from '../../components/Shared/KeyboardShortcutsModal';
import {
    Menu, CheckCircle2, Play, Share, MousePointer2, LayoutTemplate,
    Type, Image as ImageIcon, PenTool, Settings, ChevronDown,
    AlignLeft, AlignCenter, AlignRight, Layers, Sliders, X,
    RefreshCw, ZoomIn, ZoomOut, FilePlus, Copy, Trash2, Lock, Unlock, Eye, ChevronUp
} from 'lucide-react';
import { DataSourceModal } from '../../components/Modals/DataSourceModal';

const EditorScreen: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const {
        leftSidebarOpen,
        rightPanelOpen,
        closeModal,
        activeModal,
        toggleLeftSidebar,
        toggleRightPanel
    } = useUIStore();
    const { currentTemplate, loadTemplate, newTemplate, isLoading } = useTemplateStore();
    const { canvas } = useCanvasStore();
    const [zoom, setZoom] = useState(100);

    // Name Editing State
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const { updateCurrentTemplate, saveTemplate } = useTemplateStore();

    // Autosave Logic
    const { isPreviewMode, generationProgress } = useMailMergeStore();
    const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const isRunning = isPreviewMode || generationProgress.status !== 'idle';

    const triggerAutoSave = React.useCallback(() => {
        if (!canvas || !currentTemplate || isRunning) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(async () => {
            const canvasJson = canvas.toJSON();
            // Generate thumbnail
            const thumbnail = canvas.toDataURL({
                format: 'webp',
                quality: 0.5,
                multiplier: 0.2 // Small thumbnail for dashboard
            });

            await saveTemplate({
                ...currentTemplate,
                data: canvasJson,
                thumbnail
            });
            console.log("Autosaved template with thumbnail");
        }, 2000); // 2 second debounce
    }, [canvas, currentTemplate, isRunning, saveTemplate]);

    // Listen to canvas changes for autosave
    React.useEffect(() => {
        if (!canvas) return;

        const handleCanvasChange = () => {
            triggerAutoSave();
        };

        canvas.on('object:modified', handleCanvasChange);
        canvas.on('object:added', handleCanvasChange);
        canvas.on('object:removed', handleCanvasChange);

        return () => {
            canvas.off('object:modified', handleCanvasChange);
            canvas.off('object:added', handleCanvasChange);
            canvas.off('object:removed', handleCanvasChange);
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [canvas, triggerAutoSave]);

    // Initial Load Logic
    React.useEffect(() => {
        if (id && id !== 'new') {
            loadTemplate(id);
        } else {
            // New design
            newTemplate();
        }
    }, [id, loadTemplate, newTemplate]);

    // Auto-select sidebar tab from query param (e.g., ?tab=mailmerge)
    const [searchParams] = useSearchParams();
    const { setActiveTab } = useUIStore();
    React.useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams, setActiveTab]);

    // Load Data into Canvas
    // We use a ref to track if we've already loaded the initial data for this specific ID
    // to prevent overwriting if currentTemplate updates (e.g. during saves)
    const loadedIdRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        if (canvas && currentTemplate && currentTemplate.data && currentTemplate.id !== loadedIdRef.current) {
            canvas.loadFromJSON(currentTemplate.data, () => {
                canvas.renderAll();
                loadedIdRef.current = currentTemplate.id;
            });
        }
    }, [canvas, currentTemplate]);

    // Placeholder for export action
    const handleExport = () => {
        // Logic to trigger export modal or action
        console.log("Export triggered");
    };

    return (
        <div className="relative flex h-screen w-full flex-col bg-[var(--stitch-background)] font-sans overflow-hidden text-[var(--stitch-text-primary)]">

            {/* --- Header --- */}
            <header className="z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--stitch-border)] px-4 bg-[var(--stitch-surface-primary)]">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex size-9 items-center justify-center rounded-lg hover:bg-[var(--stitch-surface-secondary)] transition-colors text-[var(--stitch-text-secondary)]"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden sm:block w-px h-6 bg-[var(--stitch-divider)]"></div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 group">
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    className="text-sm font-semibold text-[var(--stitch-text-primary)] bg-transparent border-b border-[var(--stitch-primary)] outline-none min-w-[120px]"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onBlur={() => {
                                        if (tempName && tempName !== currentTemplate?.name) {
                                            const thumbnail = canvas?.toDataURL({
                                                format: 'webp',
                                                quality: 0.5,
                                                multiplier: 0.2
                                            });
                                            updateCurrentTemplate({ name: tempName, thumbnail });
                                            saveTemplate({ ...currentTemplate!, name: tempName, thumbnail: thumbnail || currentTemplate?.thumbnail || '' });
                                        }
                                        setIsEditingName(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (tempName && tempName !== currentTemplate?.name) {
                                                const thumbnail = canvas?.toDataURL({
                                                    format: 'webp',
                                                    quality: 0.5,
                                                    multiplier: 0.2
                                                });
                                                updateCurrentTemplate({ name: tempName, thumbnail });
                                                saveTemplate({ ...currentTemplate!, name: tempName, thumbnail: thumbnail || currentTemplate?.thumbnail || '' });
                                            }
                                            setIsEditingName(false);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsEditingName(false);
                                        }
                                    }}
                                />
                            ) : (
                                <div
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => {
                                        setTempName(currentTemplate?.name || 'Untitled Design');
                                        setIsEditingName(true);
                                    }}
                                >
                                    <h1 className="text-sm font-semibold text-[var(--stitch-text-primary)] truncate group-hover:underline decoration-indigo-500 underline-offset-2 transition-all">
                                        {currentTemplate?.name || 'Untitled Design'}
                                    </h1>
                                    <PenTool size={12} className="text-[var(--stitch-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--stitch-text-tertiary)]">
                            <CheckCircle2 size={10} className="text-[var(--stitch-success)] fill-current" />
                            <span>{isLoading ? 'Saving...' : 'Saved'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--stitch-text-secondary)] hover:text-[var(--stitch-primary)] hover:bg-[var(--stitch-surface-secondary)] rounded-md transition-colors">
                        <Play size={16} />
                        Animate
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary-hover)] text-white pl-4 pr-3 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <span className="text-xs font-bold tracking-wide">Export</span>
                        <Share size={16} />
                    </button>
                </div>
            </header>

            {/* --- Main Layout --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* 1. Left Sidebar Rail & Panel */}
                <aside className="z-40 flex flex-col border-r border-[var(--stitch-border)] bg-[var(--stitch-surface-primary)] h-full transition-all duration-300 relative shadow-sm"
                    style={{ width: leftSidebarOpen ? '400px' : '72px' }}
                >
                    <LeftSidebar />
                </aside>

                {/* 2. Center Stage (Canvas) */}
                <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--stitch-canvas-workspace)]">

                    {/* Docked Toolbar (Contextual) */}
                    <div className="z-30 flex items-center w-full px-4 h-12 bg-[var(--stitch-surface-primary)] border-b border-[var(--stitch-border)] shadow-sm shrink-0">
                        <ContextualRibbon />
                    </div>

                    {/* Scrollable Canvas Area */}
                    <div className="flex-1 flex flex-col items-center overflow-auto p-8 relative">

                        {/* Page Header */}
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center justify-between px-1 w-[800px] max-w-full mx-auto">
                                <div className="flex items-center gap-2 text-[var(--stitch-text-secondary)]">
                                    <span className="font-semibold text-xs">Page 1</span>
                                    <span className="text-xs">-</span>
                                    <span className="text-xs hover:bg-[var(--stitch-surface-secondary)] px-1 py-0.5 rounded cursor-text">Add page title</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--stitch-text-tertiary)]">
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><ChevronUp size={14} /></button>
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><ChevronDown size={14} /></button>
                                    <div className="w-px h-3 bg-[var(--stitch-divider)] mx-1"></div>
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><Eye size={14} /></button>
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><Lock size={14} /></button>
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><Copy size={14} /></button>
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><Trash2 size={14} /></button>
                                    <button className="p-1 hover:bg-[var(--stitch-surface-secondary)] rounded text-[var(--stitch-text-secondary)]"><FilePlus size={14} /></button>
                                </div>
                            </div>

                            {/* Canvas Wrapper */}
                            <div className="relative flex items-center justify-center">
                                <CanvasWorkspace />
                            </div>
                        </div>

                        {/* Floating Zoom Controls - Positioned absolute to the viewport, not scroll */}
                        <div className="fixed bottom-6 right-80 z-30 flex items-center gap-2 px-3 py-1.5 bg-[var(--stitch-surface-primary)] rounded-lg shadow-md border border-[var(--stitch-border)] text-xs text-[var(--stitch-text-secondary)] font-medium">
                            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="hover:text-[var(--stitch-primary)] p-1"><ZoomOut size={14} /></button>
                            <span className="min-w-[3ch] text-center">{zoom}%</span>
                            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:text-[var(--stitch-primary)] p-1"><ZoomIn size={14} /></button>
                        </div>

                    </div>

                </main>

                {/* 3. Right Properties Panel */}
                <aside
                    className={`
                        z-40 flex flex-col border-l border-[var(--stitch-border)] bg-[var(--stitch-surface-primary)] h-full transition-all duration-300
                        ${rightPanelOpen ? 'w-80' : 'w-0 border-none'}
                    `}
                >
                    <div className="h-full overflow-hidden">
                        <PropertiesPanel />
                    </div>
                </aside>

                {/* Right Panel Toggle - Floating if closed */}
                {!rightPanelOpen && (
                    <button
                        onClick={toggleRightPanel}
                        className="absolute right-4 top-24 z-30 p-2 bg-[var(--stitch-surface-primary)] rounded-full shadow-md border border-[var(--stitch-border)] text-[var(--stitch-text-secondary)] hover:text-[var(--stitch-primary)] transition-colors"
                        title="Open Properties"
                    >
                        <Settings size={20} />
                    </button>
                )}

            </div>

            {/* Modals */}
            <DataPreviewModal
                isOpen={activeModal === 'dataPreview'}
                onClose={closeModal}
            />
            <DataSourceModal />
            <KeyboardShortcutsModal
                isOpen={activeModal === 'keyboardShortcuts'}
                onClose={closeModal}
                shortcuts={{}} // Pass actual shortcuts if needed
            />

        </div>
    );
};

export default EditorScreen;
