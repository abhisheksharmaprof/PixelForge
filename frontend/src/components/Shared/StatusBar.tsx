import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { useSelectionStore } from '../../store/selectionStore';
import { Minus, Plus, Maximize, CheckCircle, Save, AlertCircle } from 'lucide-react';

export const StatusBar: React.FC = () => {
    const { zoom, setZoom } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();
    const { isSaving, lastSaved } = useUIStore();

    const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 5));
    const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.1));

    // Format selection info
    const getSelectionInfo = () => {
        if (selectedObjects.length === 0) return 'No selection';
        if (selectedObjects.length > 1) return `${selectedObjects.length} objects selected`;

        const activeObject = selectedObjects[0];
        const type = activeObject.type;
        const width = Math.round(activeObject.width! * activeObject.scaleX!);
        const height = Math.round(activeObject.height! * activeObject.scaleY!);
        return `${type?.charAt(0).toUpperCase() + type?.slice(1)}: ${width} x ${height}px`;
    };

    return (
        <div className="h-8 bg-[#1e1e1e] border-t border-[var(--stitch-border)] flex items-center justify-between px-4 text-xs text-gray-400 select-none z-50">
            {/* Left: Save Status */}
            <div className="flex items-center gap-2 min-w-[200px]">
                {isSaving ? (
                    <>
                        <Save size={12} className="animate-pulse text-yellow-500" />
                        <span>Saving changes...</span>
                    </>
                ) : (
                    <>
                        <CheckCircle size={12} className="text-green-500" />
                        <span>All changes saved</span>
                    </>
                )}
            </div>

            {/* Center: Selection Info */}
            <div className="flex items-center gap-4 font-mono">
                <span>{getSelectionInfo()}</span>
            </div>

            {/* Right: Zoom Controls */}
            <div className="flex items-center gap-2 min-w-[200px] justify-end">
                <button
                    onClick={handleZoomOut}
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Zoom Out (Ctrl+-)"
                >
                    <Minus size={12} />
                </button>
                <span className="w-12 text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={handleZoomIn}
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Zoom In (Ctrl++)"
                >
                    <Plus size={12} />
                </button>
                <div className="w-px h-4 bg-gray-700 mx-2" />
                <button
                    onClick={() => setZoom(1)}
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Reset Zoom to 100%"
                >
                    <Maximize size={12} />
                </button>
            </div>
        </div>
    );
};
