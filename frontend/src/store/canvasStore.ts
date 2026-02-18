import { create } from 'zustand';
import { fabric } from 'fabric';

interface GradientStop {
    color: string;
    offset: number;
}

interface BackgroundGradient {
    type: 'linear' | 'radial';
    angle: number;
    stops: GradientStop[];
}

interface BackgroundEffects {
    blur: number;
    brightness: number;
    contrast: number;
    saturation: number;
    overlayColor: string;
    overlayOpacity: number;
    vignette: number;
}

interface WatermarkState {
    enabled: boolean;
    type: 'text' | 'image';
    text: string;
    fontFamily: string;
    fontSize: number;
    image: string;
    opacity: number;
    rotation: number;
    scale: number;
    position: 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
    tiling: boolean;
}

interface CanvasState {
    canvas: fabric.Canvas | null;
    setCanvas: (canvas: fabric.Canvas | null) => void;
    canvasSize: { width: number; height: number };
    setCanvasSize: (size: { width: number; height: number }) => void;

    // Background
    backgroundType: 'solid' | 'gradient' | 'image' | 'transparent';
    setBackgroundType: (type: 'solid' | 'gradient' | 'image' | 'transparent') => void;
    backgroundColor: string;
    setBackgroundColor: (color: string) => void;
    backgroundGradient: BackgroundGradient;
    setBackgroundGradient: (gradient: Partial<BackgroundGradient>) => void;
    backgroundImage: string | null;
    setBackgroundImage: (url: string | null) => void;
    backgroundImageFit: 'fill' | 'fit' | 'stretch' | 'tile' | 'center';
    setBackgroundImageFit: (fit: 'fill' | 'fit' | 'stretch' | 'tile' | 'center') => void;
    backgroundImageOpacity: number;
    setBackgroundImageOpacity: (opacity: number) => void;
    backgroundImageRotation: number;
    setBackgroundImageRotation: (rotation: number) => void;
    backgroundEffects: BackgroundEffects;
    setBackgroundEffects: (effects: Partial<BackgroundEffects>) => void;
    backgroundLocked: boolean;
    setBackgroundLocked: (locked: boolean) => void;

    zoom: number;
    setZoom: (zoom: number) => void;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    showRulers: boolean;
    setShowRulers: (show: boolean) => void;
    showGuides: boolean;
    setShowGuides: (show: boolean) => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    snapToGuides: boolean;
    setSnapToGuides: (snap: boolean) => void;
    snapToObjects: boolean;
    setSnapToObjects: (snap: boolean) => void;
    gridSize: number;
    setGridSize: (size: number) => void;
    gridColor: string;
    setGridColor: (color: string) => void;
    rulerUnit: 'px' | 'mm' | 'cm' | 'inch';
    setRulerUnit: (unit: 'px' | 'mm' | 'cm' | 'inch') => void;
    margins: { top: number; right: number; bottom: number; left: number };
    setMargins: (margins: { top: number; right: number; bottom: number; left: number }) => void;
    watermark: WatermarkState;
    setWatermark: (watermark: Partial<WatermarkState>) => void;

    // Guides
    guides: Array<{ id: string; type: 'horizontal' | 'vertical'; position: number }>;
    addGuide: (guide: { type: 'horizontal' | 'vertical'; position: number }) => void;
    removeGuide: (id: string) => void;
    updateGuide: (id: string, position: number) => void;

    // Method to trigger re-render of canvas (helper)
    refreshCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    canvas: null,
    setCanvas: (canvas) => set({ canvas }),

    canvasSize: { width: 794, height: 1123 }, // A4 at 96 DPI
    setCanvasSize: (size) => set({ canvasSize: size }),

    // Background
    backgroundType: 'solid',
    setBackgroundType: (type) => set({ backgroundType: type }),

    backgroundColor: '#ffffff',
    setBackgroundColor: (color) => set({ backgroundColor: color }),

    backgroundGradient: {
        type: 'linear',
        angle: 180,
        stops: [
            { color: '#ffffff', offset: 0 },
            { color: '#f0f0f0', offset: 1 }
        ]
    },
    setBackgroundGradient: (gradient) => set((state) => ({
        backgroundGradient: { ...state.backgroundGradient, ...gradient }
    })),

    backgroundImage: null,
    setBackgroundImage: (url) => set({ backgroundImage: url }),

    backgroundImageFit: 'fill',
    setBackgroundImageFit: (fit) => set({ backgroundImageFit: fit }),

    backgroundImageOpacity: 1,
    setBackgroundImageOpacity: (opacity) => set({ backgroundImageOpacity: opacity }),

    backgroundImageRotation: 0,
    setBackgroundImageRotation: (rotation) => set({ backgroundImageRotation: rotation }),

    backgroundEffects: {
        blur: 0,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        overlayColor: '#000000',
        overlayOpacity: 0,
        vignette: 0
    },
    setBackgroundEffects: (effects) => set((state) => ({
        backgroundEffects: { ...state.backgroundEffects, ...effects }
    })),

    backgroundLocked: false,
    setBackgroundLocked: (locked) => set({ backgroundLocked: locked }),

    zoom: 60,
    setZoom: (zoom) => set({ zoom }),

    showGrid: false,
    setShowGrid: (show) => set({ showGrid: show }),

    showRulers: false,
    setShowRulers: (show) => set({ showRulers: show }),

    showGuides: true,
    setShowGuides: (show) => set({ showGuides: show }),

    snapToGrid: false,
    setSnapToGrid: (snap) => set({ snapToGrid: snap }),

    snapToGuides: true,
    setSnapToGuides: (snap) => set({ snapToGuides: snap }),

    snapToObjects: true,
    setSnapToObjects: (snap) => set({ snapToObjects: snap }),

    gridSize: 20,
    setGridSize: (size) => set({ gridSize: size }),

    gridColor: '#cccccc',
    setGridColor: (color) => set({ gridColor: color }),

    rulerUnit: 'px',
    setRulerUnit: (unit) => set({ rulerUnit: unit }),

    margins: { top: 50, right: 50, bottom: 50, left: 50 },
    setMargins: (margins) => set({ margins }),

    watermark: {
        enabled: false,
        type: 'text',
        text: 'DRAFT',
        fontFamily: 'Arial',
        fontSize: 72,
        image: '',
        opacity: 0.1,
        rotation: -45,
        scale: 1,
        position: 'mc',
        tiling: false
    },
    setWatermark: (watermark) => set((state) => ({
        watermark: { ...state.watermark, ...watermark }
    })),

    // Guides
    guides: [],
    addGuide: (guide) => set((state) => ({
        guides: [...state.guides, { ...guide, id: `guide-${Date.now()}` }]
    })),
    removeGuide: (id) => set((state) => ({
        guides: state.guides.filter(g => g.id !== id)
    })),
    updateGuide: (id, position) => set((state) => ({
        guides: state.guides.map(g => g.id === id ? { ...g, position } : g)
    })),

    refreshCanvas: () => {
        const canvas = get().canvas;
        if (canvas) {
            canvas.requestRenderAll();
        }
    }
}));
