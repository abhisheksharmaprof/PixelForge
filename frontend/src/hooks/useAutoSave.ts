import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useTemplateStore, Template } from '../store/templateStore';
import { useSettingsStore } from '../store/settingsStore';
import { CanvasHelpers } from '../utils/canvasHelpers';

interface AutoSaveResult {
    lastSaved: string | null;
    isSaving: boolean;
    triggerSave: () => Promise<void>;
}

export const useAutoSave = (): AutoSaveResult => {
    const canvas = useCanvasStore((state) => state.canvas);
    const canvasSize = useCanvasStore((state) => state.canvasSize);

    const { currentTemplate, saveTemplate, setCurrentTemplate } = useTemplateStore();

    const {
        autoSaveEnabled,
        autoSaveInterval,
        lastAutoSave,
        setLastAutoSave,
        notifyOnAutoSave,
        generateDefaultTemplateName,
    } = useSettingsStore();

    const isSavingRef = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Create or update template from current canvas state
    const createTemplateFromCanvas = useCallback((): Template | null => {
        if (!canvas) return null;

        const canvasData = CanvasHelpers.getCanvasData(canvas);
        const now = new Date().toISOString();

        // Generate thumbnail
        let thumbnail = '';
        try {
            thumbnail = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
        } catch (e) {
            console.warn('Failed to generate thumbnail:', e);
        }

        // If we have a current template, update it
        if (currentTemplate) {
            return {
                ...currentTemplate,
                data: canvasData,
                thumbnail,
                updatedAt: now,
            };
        }

        // Otherwise create new template with generated name
        return {
            id: '',
            name: generateDefaultTemplateName(),
            description: '',
            category: 'Custom',
            thumbnail,
            data: canvasData,
            createdAt: now,
            updatedAt: now,
            tags: [],
        };
    }, [canvas, currentTemplate, generateDefaultTemplateName]);

    // Perform auto-save
    const performAutoSave = useCallback(async () => {
        if (isSavingRef.current || !canvas) return;

        // Check if canvas has any content worth saving
        const objects = canvas.getObjects();
        const hasObjects = objects.length > 0;
        const hasBackgroundImage = !!canvas.backgroundImage;
        const hasCustomBackground = canvas.backgroundColor &&
            canvas.backgroundColor !== '#ffffff' &&
            canvas.backgroundColor !== 'white' &&
            canvas.backgroundColor !== '';

        // Only save if there's actual content OR if we're updating an existing template
        // This prevents auto-saving empty/new canvases but allows saving cleared templates
        if (!hasObjects && !hasBackgroundImage && !hasCustomBackground && !currentTemplate) {
            return; // Don't save empty canvas without an existing template
        }

        isSavingRef.current = true;

        try {
            const template = createTemplateFromCanvas();
            if (!template) {
                isSavingRef.current = false;
                return;
            }

            await saveTemplate(template);
            const now = new Date().toISOString();
            setLastAutoSave(now);

            if (notifyOnAutoSave) {
                // Show subtle notification
                showAutoSaveNotification();
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [canvas, currentTemplate, createTemplateFromCanvas, saveTemplate, setLastAutoSave, notifyOnAutoSave]);

    // Manual trigger for save
    const triggerSave = useCallback(async () => {
        await performAutoSave();
    }, [performAutoSave]);

    // Set up auto-save interval
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (autoSaveEnabled && autoSaveInterval > 0) {
            const intervalMs = autoSaveInterval * 60 * 1000; // Convert minutes to ms
            intervalRef.current = setInterval(() => {
                performAutoSave();
            }, intervalMs);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoSaveEnabled, autoSaveInterval, performAutoSave]);

    // Auto-save on significant changes (debounced)
    useEffect(() => {
        if (!autoSaveEnabled || !canvas) return;

        let debounceTimer: NodeJS.Timeout | null = null;

        const handleChange = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            // Debounce for 30 seconds after last change
            debounceTimer = setTimeout(() => {
                performAutoSave();
            }, 30000);
        };

        canvas.on('object:modified', handleChange);
        canvas.on('object:added', handleChange);
        canvas.on('object:removed', handleChange);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            canvas.off('object:modified', handleChange);
            canvas.off('object:added', handleChange);
            canvas.off('object:removed', handleChange);
        };
    }, [canvas, autoSaveEnabled, performAutoSave]);

    return {
        lastSaved: lastAutoSave,
        isSaving: isSavingRef.current,
        triggerSave,
    };
};

// Show a subtle auto-save notification
function showAutoSaveNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'auto-save-notification';
    notification.innerHTML = `
        <span class="auto-save-icon">✓</span>
        <span>Auto-saved</span>
    `;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 196, 204, 0.9);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 2000);
}
