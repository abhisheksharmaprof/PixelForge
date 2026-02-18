import React from 'react';
import { StitchButton } from '../../components/common/StitchButton';
import { StitchFlex } from '../../components/common/StitchLayout';
import { useCanvasStore } from '../../store/canvasStore';
import { useHistoryStore } from '../../store/historyStore';
import { useTemplateStore } from '../../store/templateStore';
import { Save, Download, Undo, Redo, Home, Share2 } from 'lucide-react';

export const StitchEditorHeader: React.FC = () => {
    const { undo, redo, canUndo, canRedo } = useHistoryStore();
    const { currentTemplate, saveTemplate } = useTemplateStore();
    const { canvas } = useCanvasStore();

    const handleSave = async () => {
        if (currentTemplate && canvas) {
            // Mock save for now or call actual store
            console.log("Saving via Stitch Header");
            // Note: Actual logic requires data extraction which is in CanvasHelpers
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm z-20 relative">
            <StitchFlex className="gap-4">
                <StitchButton variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'}>
                    <Home size={18} />
                </StitchButton>

                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">Project</span>
                    <input
                        type="text"
                        defaultValue={currentTemplate?.name || "Untitled Project"}
                        className="font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 text-sm h-5 hover:bg-gray-50 rounded px-1 transition-colors"
                    />
                </div>
            </StitchFlex>

            <StitchFlex className="gap-2">
                <StitchButton variant="ghost" size="sm" onClick={undo} disabled={!canUndo} title="Undo">
                    <Undo size={18} />
                </StitchButton>
                <StitchButton variant="ghost" size="sm" onClick={redo} disabled={!canRedo} title="Redo">
                    <Redo size={18} />
                </StitchButton>
            </StitchFlex>

            <StitchFlex className="gap-3">
                <div className="flex -space-x-2 mr-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white text-white flex items-center justify-center text-xs">AS</div>
                    <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white text-white flex items-center justify-center text-xs">JD</div>
                </div>

                <StitchButton variant="secondary" size="sm" leftIcon={<Share2 size={16} />}>
                    Share
                </StitchButton>

                <StitchButton variant="primary" size="sm" leftIcon={<Download size={16} />}>
                    Export
                </StitchButton>
            </StitchFlex>
        </header>
    );
};
