import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useTemplateStore, Template } from '../../store/templateStore';
import { useHistoryStore } from '../../store/historyStore';
import {
    Search,
    Plus,
    FileText,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import { StitchInput } from '../common/StitchInput';
import { StitchButton } from '../common/StitchButton';
import clsx from 'clsx';
// CSS removed in favor of Tailwind

type Category = 'all' | 'certificates' | 'id_cards' | 'posters' | 'marksheets' | 'custom';

export const TemplatesTab: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { savedTemplates, loadTemplates, setCurrentTemplate, isLoading } = useTemplateStore();
    const { clearHistory } = useHistoryStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category>('all');
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

    // Load templates on mount
    useEffect(() => {
        loadTemplates();
    }, []);

    const categories: { id: Category; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'certificates', label: 'Certificates' },
        { id: 'id_cards', label: 'ID Cards' },
        { id: 'posters', label: 'Posters' },
        { id: 'marksheets', label: 'Marksheets' },
        { id: 'custom', label: 'Custom' },
    ];

    // Filter templates
    const filteredTemplates = savedTemplates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'all' ||
            template.category?.toLowerCase().replace(/\s+/g, '_') === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Load template onto canvas
    const handleLoadTemplate = async (template: Template) => {
        if (!canvas || !template.data) return;

        if (canvas.getObjects().length > 0) {
            if (!confirm(`Load template "${template.name}"? This will replace the current canvas content.`)) {
                return;
            }
        }

        setIsLoadingTemplate(true);
        try {
            // Clear history before loading
            clearHistory();

            canvas.loadFromJSON(template.data, () => {
                canvas.renderAll();
                setCurrentTemplate(template);
                setIsLoadingTemplate(false);
            });
        } catch (error) {
            console.error('Failed to load template:', error);
            alert('Failed to load template');
            setIsLoadingTemplate(false);
        }
    };

    // Create new blank template
    const handleNewTemplate = () => {
        if (!canvas) return;

        if (canvas.getObjects().length > 0) {
            if (!confirm('Create new template? This will clear the current canvas.')) {
                return;
            }
        }

        clearHistory();
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', () => canvas.renderAll());
        setCurrentTemplate(null);
    };

    // Format file size
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--stitch-surface)] text-[var(--stitch-text-primary)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--stitch-border)] flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Templates</h3>
                <button
                    onClick={handleNewTemplate}
                    className="p-2 rounded-full hover:bg-[var(--stitch-surface-hover)] text-[var(--stitch-primary)] transition-colors"
                    title="New Blank Template"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Search */}
                <StitchInput
                    icon={<Search size={16} />}
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={clsx(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border",
                                selectedCategory === cat.id
                                    ? "bg-[var(--stitch-primary)] text-white border-[var(--stitch-primary)] shadow-sm"
                                    : "bg-[var(--stitch-background)] text-[var(--stitch-text-secondary)] border-[var(--stitch-border)] hover:border-[var(--stitch-primary)] hover:text-[var(--stitch-primary)]"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {isLoading ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-12 text-[var(--stitch-text-tertiary)]">
                            <Loader2 className="animate-spin mb-2" />
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-12 text-[var(--stitch-text-tertiary)] border-2 border-dashed border-[var(--stitch-border)] rounded-xl">
                            <FileText size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No templates found</p>
                            <span className="text-xs text-center px-4 mt-1 opacity-70">Try adjusting your filters</span>
                        </div>
                    ) : (
                        filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => handleLoadTemplate(template)}
                                className={clsx(
                                    "group relative cursor-pointer border border-[var(--stitch-border)] rounded-lg overflow-hidden bg-[var(--stitch-background)] hover:shadow-md transition-all duration-200",
                                    isLoadingTemplate && "opacity-50 pointer-events-none"
                                )}
                            >
                                <div className="aspect-[3/4] w-full relative bg-gray-100 flex items-center justify-center overflow-hidden">
                                    {template.thumbnail ? (
                                        <img
                                            src={template.thumbnail}
                                            alt={template.name}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <ImageIcon className="text-gray-300" size={32} />
                                    )}
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                                </div>
                                <div className="p-3">
                                    <p className="font-medium text-sm text-[var(--stitch-text-primary)] truncate">{template.name}</p>
                                    <p className="text-[10px] text-[var(--stitch-text-tertiary)] mt-1 truncate">
                                        {template.category || 'Custom'} • {formatDate(template.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
