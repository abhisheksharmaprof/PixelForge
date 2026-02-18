import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { fabric } from 'fabric';
import { Search, Grid, List as ListIcon } from 'lucide-react';
import { StitchInput } from '../common/StitchInput';
import { StitchAccordion } from '../common/StitchAccordion';
import { textLibrary, TextLibraryItem } from '../../data/textLibrary';

export const TextTab: React.FC = () => {
    const { canvas } = useCanvasStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleDragStart = (e: React.DragEvent, item: TextLibraryItem) => {
        const data = JSON.stringify({
            type: 'text',
            ...item.defaultProps
        });
        e.dataTransfer.setData('application/json', data);
        e.dataTransfer.setData('text/plain', data); // Fallback for broader compatibility
        e.dataTransfer.effectAllowed = 'copy';
    };

    const addTextToCanvas = (item: TextLibraryItem) => {
        if (!canvas) return;

        let text = item.defaultProps.text;
        if (item.defaultProps.stitchType === 'dynamic-date') {
            text = new Date().toLocaleDateString();
        }

        const textbox = new fabric.Textbox(text, {
            left: 100,
            top: 100,
            width: item.defaultProps.width || 300,
            fontFamily: item.defaultProps.fontFamily,
            fontSize: item.defaultProps.fontSize,
            fontWeight: item.defaultProps.fontWeight,
            fill: item.defaultProps.fill,
            textAlign: item.defaultProps.textAlign,
            lineHeight: item.defaultProps.lineHeight,
            charSpacing: item.defaultProps.charSpacing,
            fontStyle: item.defaultProps.fontStyle,
            underline: item.defaultProps.underline,
            stroke: item.defaultProps.stroke,
            strokeWidth: item.defaultProps.strokeWidth,
            shadow: item.defaultProps.shadow,
            data: {
                stitchType: item.defaultProps.stitchType
            }
        });

        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.requestRenderAll();
    };

    const filteredCategories = textLibrary.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    return (
        <div className="flex flex-col h-full bg-[var(--stitch-surface-primary)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--stitch-border)] space-y-4">
                <h2 className="text-lg font-semibold text-[var(--stitch-text-primary)]">Text</h2>

                <StitchInput
                    placeholder="Search text elements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={16} />}
                />

                <div className="flex justify-between items-center text-xs text-[var(--stitch-text-secondary)]">
                    <span>{searchQuery ? 'Search Results' : 'Library'}</span>
                    <div className="flex gap-1 bg-[var(--stitch-background)] p-1 rounded-md border border-[var(--stitch-border)]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[var(--stitch-surface-secondary)] text-[var(--stitch-text-primary)]' : 'hover:bg-[var(--stitch-surface-hover)]'}`}
                        >
                            <Grid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1 rounded ${viewMode === 'list' ? 'bg-[var(--stitch-surface-secondary)] text-[var(--stitch-text-primary)]' : 'hover:bg-[var(--stitch-surface-hover)]'}`}
                        >
                            <ListIcon size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Library Content */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {filteredCategories.map(category => (
                    <StitchAccordion
                        key={category.id}
                        title={category.label}
                        defaultOpen={true}
                    >
                        <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {category.items.map(item => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        onClick={() => addTextToCanvas(item)}
                                        className="group cursor-pointer select-none bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-lg p-3 hover:border-[var(--stitch-primary)] hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <div className="p-2 rounded-full bg-[var(--stitch-surface-secondary)] group-hover:bg-[var(--stitch-primary-light)] group-hover:text-[var(--stitch-primary)] transition-colors">
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-[var(--stitch-text-primary)]">{item.label}</div>
                                                {viewMode === 'list' && (
                                                    <div className="text-xs text-[var(--stitch-text-tertiary)] mt-1 line-clamp-1">{item.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </StitchAccordion>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="text-center py-8 text-[var(--stitch-text-tertiary)] bg-[var(--stitch-surface-secondary)] rounded-md m-4">
                        <p>No elements found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
