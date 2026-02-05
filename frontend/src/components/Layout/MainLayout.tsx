import React from 'react';
import { TopToolbar } from './TopToolbar';
import { LeftSidebar } from '../LeftSidebar/LeftSidebar';
import { CanvasWorkspace } from '../Canvas/CanvasWorkspace';
import { ContextualRibbon } from '../ContextualRibbon/ContextualRibbon';
import { PropertiesPanel } from '../PropertiesPanel/PropertiesPanel';
import { BottomPanel } from '../BottomPanel/BottomPanel';
import { useUIStore } from '../../store/uiStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { DataPreviewModal } from '../Shared/DataPreviewModal';
import { ContextMenu, ContextMenuItem } from '../Shared/ContextMenu';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    const {
        leftSidebarOpen,
        rightPanelOpen,
        bottomPanelOpen,
        bottomPanelHeight,
        fullscreenMode,
        contextMenu,
        hideContextMenu,
    } = useUIStore();

    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

    return (
        <div className={`main-layout ${fullscreenMode ? 'fullscreen' : ''}`}>
            {/* TOP TOOLBAR - 60px Fixed */}
            <TopToolbar />

            {/* CONTEXTUAL RIBBON - 90-110px, Full Width Below Toolbar */}
            <ContextualRibbon />

            {/* MAIN WORKSPACE AREA - Left Sidebar | Canvas | Right Panel */}
            <div className="workspace-container">
                {/* LEFT SIDEBAR - 280px */}
                {leftSidebarOpen && (
                    <div className="left-sidebar-container">
                        <LeftSidebar />
                    </div>
                )}

                {/* MAIN CANVAS WORKSPACE */}
                <div className="center-workspace">
                    <CanvasWorkspace />
                </div>

                {/* RIGHT PROPERTIES PANEL - 320px */}
                {rightPanelOpen && (
                    <div className="right-panel-container">
                        <PropertiesPanel />
                    </div>
                )}
            </div>

            {/* BOTTOM PANEL - 200px Collapsible */}
            {bottomPanelOpen && (
                <div
                    className="bottom-panel-container"
                    style={{ height: `${bottomPanelHeight}px` }}
                >
                    <BottomPanel />
                </div>
            )}

            {/* Modals */}
            <DataPreviewModal
                isOpen={useUIStore.getState().activeModal === 'dataPreview'}
                onClose={() => useUIStore.getState().closeModal()}
            />

            {/* Global Overlays */}
            {contextMenu.visible && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenu.items as ContextMenuItem[]}
                    onClose={hideContextMenu}
                />
            )}
        </div>
    );
};
