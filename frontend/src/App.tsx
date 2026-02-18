import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { NotificationSystem } from './components/Shared/NotificationSystem';
import { KeyboardShortcutsModal } from './components/Shared/KeyboardShortcutsModal';
import { AdvancedTextPropertiesModal } from './components/Modals/AdvancedTextPropertiesModal';
import { KeyboardShortcutsManager } from './utils/keyboardShortcuts';
import { FindReplaceModal } from './components/Modals/FindReplaceModal';
import { SpecialCharacterModal } from './components/Modals/SpecialCharacterModal';
import { TextStyleManagerModal } from './components/Modals/TextStyleManagerModal';
import { MailMergeModal } from './components/Modals/MailMergeModal';
import { TextEffectsLibraryModal } from './components/Modals/TextEffectsLibraryModal';
import { StatusBar } from './components/Shared/StatusBar';

// ... existing imports ...


import { useCanvasStore } from './store/canvasStore';
import { useTemplateStore } from './store/templateStore';
import { useHistoryStore } from './store/historyStore';
import { useUIStore } from './store/uiStore';
import { useSelectionStore } from './store/selectionStore';
// Styles are imported via index.css in main.tsx

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import EditorScreen from './screens/editor/EditorScreen';
import BulkGenerateScreen from './screens/generate/BulkGenerateScreen';

const App: React.FC = () => {
    const canvas = useCanvasStore((s) => s.canvas);
    const { activeModal, closeModal } = useUIStore();
    const keyboardManagerRef = useRef<KeyboardShortcutsManager | null>(null);
    const [shortcuts, setShortcuts] = useState<Record<string, any>>({});

    // Initialize keyboard shortcuts when canvas is ready (Global listener)
    useEffect(() => {
        if (canvas && !keyboardManagerRef.current) {
            const manager = new KeyboardShortcutsManager(canvas, {
                canvasStore: useCanvasStore.getState(),
                templateStore: useTemplateStore.getState(),
                historyStore: useHistoryStore.getState(),
                uiStore: useUIStore.getState(),
                selectionStore: useSelectionStore.getState(),
            });
            manager.init();
            keyboardManagerRef.current = manager;
            setShortcuts(manager.getShortcutsByCategory());
        }

        return () => {
            if (keyboardManagerRef.current) {
                keyboardManagerRef.current.destroy();
                keyboardManagerRef.current = null;
            }
        };
    }, [canvas]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const currentTemplate = useTemplateStore.getState().currentTemplate;
            const hasContent = canvas && canvas.getObjects().length > 0;
            if (hasContent && !currentTemplate?.id) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [canvas]);

    return (
        <ErrorBoundary>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <div className="app font-sans text-slate-900">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<LoginScreen />} />
                        <Route path="/register" element={<RegisterScreen />} />
                        <Route path="/dashboard" element={<DashboardScreen />} />
                        <Route path="/editor/:id?" element={<EditorScreen />} />
                        <Route path="/bulk-generate" element={<BulkGenerateScreen />} />
                    </Routes>

                    {/* Notification System - Global Overlay */}
                    <NotificationSystem />

                    {/* Keyboard Shortcuts Modal - Global Overlay */}
                    <KeyboardShortcutsModal
                        isOpen={activeModal === 'keyboardShortcuts'}
                        onClose={closeModal}
                        shortcuts={shortcuts}
                    />

                    {/* Advanced Text Properties Modal */}
                    <AdvancedTextPropertiesModal />
                    <FindReplaceModal />
                    <SpecialCharacterModal />
                    <TextStyleManagerModal />
                    <MailMergeModal />
                    <TextEffectsLibraryModal />

                    <StatusBar />
                </div>
            </Router>
        </ErrorBoundary>
    );
};

export default App;
