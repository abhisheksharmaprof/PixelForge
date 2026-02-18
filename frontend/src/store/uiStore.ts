import { create } from 'zustand';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    autoClose?: boolean;
}

interface UIState {
    leftSidebarOpen: boolean;
    setLeftSidebarOpen: (open: boolean) => void;
    leftSidebarWidth: number;
    setLeftSidebarWidth: (width: number) => void;

    rightPanelOpen: boolean;
    setRightPanelOpen: (open: boolean) => void;
    rightPanelWidth: number;
    setRightPanelWidth: (width: number) => void;

    bottomPanelOpen: boolean;
    setBottomPanelOpen: (open: boolean) => void;
    bottomPanelHeight: number;
    setBottomPanelHeight: (height: number) => void;

    activeTab: string;
    setActiveTab: (tab: string) => void;

    fullscreenMode: boolean;
    setFullscreenMode: (fullscreen: boolean) => void;
    toggleFullscreen: () => void;
    toggleBottomPanel: () => void;
    toggleLeftSidebar: () => void;
    toggleRightPanel: () => void;

    // Context Menu State
    contextMenu: {
        visible: boolean;
        x: number;
        y: number;
        items: any[];
    };
    showContextMenu: (x: number, y: number, items: any[]) => void;
    hideContextMenu: () => void;

    // Modal State
    activeModal: string | null;
    openModal: (modalName: string) => void;
    closeModal: () => void;
    togglePanel: (panel: 'left' | 'right' | 'bottom') => void;

    // Notifications
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;

    // Save Status
    isSaving: boolean;
    lastSaved: Date | null;
    setIsSaving: (saving: boolean) => void;

    // Clipboard
    clipboard: any | null; // fabric.Object
    setClipboard: (obj: any | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    leftSidebarOpen: true,
    setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
    leftSidebarWidth: 320,
    setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),

    rightPanelOpen: true,
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
    rightPanelWidth: 300,
    setRightPanelWidth: (width) => set({ rightPanelWidth: width }),

    bottomPanelOpen: false,
    setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
    bottomPanelHeight: 200,
    setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),

    activeTab: 'uploads', // Default tab
    setActiveTab: (tab) => set({ activeTab: tab }),

    fullscreenMode: false,
    setFullscreenMode: (fullscreen) => set({ fullscreenMode: fullscreen }),
    toggleFullscreen: () => set((state) => ({ fullscreenMode: !state.fullscreenMode })),
    toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
    toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
    toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

    // Context Menu
    contextMenu: { visible: false, x: 0, y: 0, items: [] },
    showContextMenu: (x, y, items) => set({ contextMenu: { visible: true, x, y, items } }),
    hideContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),

    activeModal: null,
    openModal: (modalName) => set({ activeModal: modalName }),
    closeModal: () => set({ activeModal: null }),

    togglePanel: (panel: 'left' | 'right' | 'bottom') => set((state) => {
        switch (panel) {
            case 'left': return { leftSidebarOpen: !state.leftSidebarOpen };
            case 'right': return { rightPanelOpen: !state.rightPanelOpen };
            case 'bottom': return { bottomPanelOpen: !state.bottomPanelOpen };
            default: return {};
        }
    }),

    // Notifications
    notifications: [],
    addNotification: (notification) => set((state) => ({
        notifications: [
            ...state.notifications,
            { ...notification, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        ]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    clearNotifications: () => set({ notifications: [] }),

    // Save Status
    isSaving: false,
    lastSaved: null,
    setIsSaving: (saving) => set({ isSaving: saving, lastSaved: saving ? null : new Date() }),

    // Clipboard
    clipboard: null,
    setClipboard: (obj) => set({ clipboard: obj }),
}));

