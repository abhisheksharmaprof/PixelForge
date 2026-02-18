import { create } from 'zustand';

export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    data: any; // Fabric JSON
    createdAt: string;
    updatedAt: string;
    tags: string[];
}

export interface TextStyle {
    id: string;
    name: string;
    properties: Record<string, any>;
}

interface TemplateState {
    currentTemplate: Template | null;
    savedTemplates: Template[];
    isLoading: boolean;

    setCurrentTemplate: (template: Template | null) => void;
    saveTemplate: (template: Template) => Promise<void>;
    saveTemplateAs: (template: Template) => Promise<void>;
    newTemplate: () => void;
    openTemplate: () => void;
    exportTemplate: (id: string) => void;
    importTemplate: (data: any) => Promise<void>;
    loadTemplates: () => Promise<void>;
    getTemplateById: (id: string) => Template | undefined;

    // Styles
    textStyles: TextStyle[];
    addTextStyle: (style: TextStyle) => void;
    updateTextStyle: (id: string, updates: Partial<TextStyle>) => void;
    deleteTextStyle: (id: string) => void;

    deleteTemplate: (id: string) => Promise<void>;
    loadTemplate: (id: string) => Promise<void>;
    updateCurrentTemplate: (updates: Partial<Template>) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
    currentTemplate: null,
    savedTemplates: [],
    isLoading: false,

    setCurrentTemplate: (template) => set({ currentTemplate: template }),

    saveTemplate: async (template) => {
        try {
            set({ isLoading: true });
            const isNew = !template.id;
            const url = isNew
                ? 'http://localhost:3000/api/templates'
                : `http://localhost:3000/api/templates/${template.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template)
            });

            if (response.ok) {
                const saved = await response.json();
                set((state) => {
                    // Update if exists, append if new
                    const exists = state.savedTemplates.find(t => t.id === saved.id);
                    let newTemplates;
                    if (exists) {
                        newTemplates = state.savedTemplates.map(t => t.id === saved.id ? saved : t);
                    } else {
                        newTemplates = [...state.savedTemplates, saved];
                    }
                    return {
                        savedTemplates: newTemplates,
                        currentTemplate: saved,
                        isLoading: false
                    };
                });
            }
        } catch (error) {
            console.error("Failed to save template", error);
            set({ isLoading: false });
        }
    },

    loadTemplates: async () => {
        try {
            set({ isLoading: true });
            const response = await fetch('http://localhost:3000/api/templates');
            if (response.ok) {
                const templates = await response.json();
                set({ savedTemplates: templates, isLoading: false });
            }
        } catch (error) {
            console.error("Failed to load templates", error);
            set({ isLoading: false });
        }
    },

    saveTemplateAs: async (template) => {
        // Force new ID to create copy
        const newTemplate = { ...template, id: '' };
        await get().saveTemplate(newTemplate);
    },

    newTemplate: () => set({
        currentTemplate: null
    }),

    openTemplate: () => { },

    exportTemplate: (id) => {
        const template = get().savedTemplates.find(t => t.id === id);
        if (template) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", template.name + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    },

    importTemplate: async (data) => {
        set({ currentTemplate: data as Template });
    },

    getTemplateById: (id) => {
        return get().savedTemplates.find(t => t.id === id);
    },

    // Text Styles Logic (Simplified for now)
    textStyles: [
        { id: 'h1', name: 'Heading 1', properties: { fontSize: 32, fontWeight: 'bold', fontFamily: 'Inter' } },
        { id: 'h2', name: 'Heading 2', properties: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter' } },
        { id: 'body', name: 'Body', properties: { fontSize: 16, fontWeight: 'normal', fontFamily: 'Inter' } },
        { id: 'caption', name: 'Caption', properties: { fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', fill: '#666' } },
    ],
    addTextStyle: (style) => set((state) => ({ textStyles: [...state.textStyles, style] })),
    updateTextStyle: (id, updates) => set((state) => ({
        textStyles: state.textStyles.map(s => s.id === id ? { ...s, ...updates } : s)
    })),
    deleteTextStyle: (id) => set((state) => ({
        textStyles: state.textStyles.filter(s => s.id !== id)
    })),

    deleteTemplate: async (id) => {
        try {
            set({ isLoading: true });
            const response = await fetch(`http://localhost:3000/api/templates/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                set((state) => ({
                    savedTemplates: state.savedTemplates.filter(t => t.id !== id),
                    isLoading: false
                }));
            } else {
                console.error("Failed to delete template");
                set({ isLoading: false });
            }
        } catch (error) {
            console.error("Error deleting template", error);
            set({ isLoading: false });
        }
    },

    loadTemplate: async (id) => {
        try {
            set({ isLoading: true });
            const response = await fetch(`http://localhost:3000/api/templates/${id}`);
            if (response.ok) {
                const template = await response.json();
                set({ currentTemplate: template, isLoading: false });
            } else {
                console.error("Failed to load template");
                set({ isLoading: false });
            }
        } catch (error) {
            console.error("Error loading template", error);
            set({ isLoading: false });
        }
    },
    updateCurrentTemplate: (updates) => set((state) => ({
        currentTemplate: state.currentTemplate ? { ...state.currentTemplate, ...updates } : null
    })),
}));
