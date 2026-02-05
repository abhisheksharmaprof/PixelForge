import React, { useEffect, useState, useRef } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { NotificationSystem } from './components/Shared/NotificationSystem';
import { KeyboardShortcutsModal } from './components/Shared/KeyboardShortcutsModal';
import { KeyboardShortcutsManager } from './utils/keyboardShortcuts';
import { useCanvasStore } from './store/canvasStore';
import { useTemplateStore } from './store/templateStore';
import { useHistoryStore } from './store/historyStore';
import { useUIStore } from './store/uiStore';
import { useSelectionStore } from './store/selectionStore';
import './styles/globals.css';
import './styles/variables.css';

const App: React.FC = () => {
    const canvas = useCanvasStore((s) => s.canvas);
    const canvasStore = useCanvasStore.getState();
    const templateStore = useTemplateStore.getState();
    const historyStore = useHistoryStore.getState();
    const uiStore = useUIStore.getState();
    const selectionStore = useSelectionStore.getState();

    const { activeModal, closeModal } = useUIStore();
    const keyboardManagerRef = useRef<KeyboardShortcutsManager | null>(null);
    const [shortcuts, setShortcuts] = useState<Record<string, any>>({});

    // Initialize keyboard shortcuts when canvas is ready
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
            // Check if there are objects on canvas
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
            <div className="app">
                <MainLayout />

                {/* Notification System */}
                <NotificationSystem />

                {/* Keyboard Shortcuts Modal */}
                <KeyboardShortcutsModal
                    isOpen={activeModal === 'keyboardShortcuts'}
                    onClose={closeModal}
                    shortcuts={shortcuts}
                />
            </div>
        </ErrorBoundary>
    );
};

export default App;
