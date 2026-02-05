import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useTemplateStore, Template } from '../../store/templateStore';
import { useHistoryStore } from '../../store/historyStore';
import {
    FaFolderOpen,
    FaSearch,
    FaFilter,
    FaPlus,
    FaTrash,
    FaEdit,
    FaFileAlt,
} from 'react-icons/fa';
import './TemplatesTab.css';

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

        if (!confirm(`Load template "${template.name}"? This will replace the current canvas content.`)) {
            return;
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
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        setCurrentTemplate(null);
    };

    // Format file size
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return '';
        }
    };

    return (
        <div className="templates-tab sidebar-tab-content">
            {/* Header */}
            <div className="templates-header">
                <h3><FaFolderOpen /> Templates</h3>
                <button className="new-template-btn" onClick={handleNewTemplate} title="New Blank Template">
                    <FaPlus />
                </button>
            </div>

            {/* Search */}
            <div className="templates-search">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter */}
            <div className="category-pills">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="templates-grid">
                {isLoading ? (
                    <div className="loading-state">Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="empty-state">
                        <FaFileAlt size={32} />
                        <p>No templates found</p>
                        <span>Save your current design as a template to see it here</span>
                    </div>
                ) : (
                    filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            className={`template-card ${isLoadingTemplate ? 'loading' : ''}`}
                            onClick={() => handleLoadTemplate(template)}
                        >
                            <div className="template-thumbnail">
                                {template.thumbnail ? (
                                    <img src={template.thumbnail} alt={template.name} />
                                ) : (
                                    <div className="no-thumbnail">
                                        <FaFileAlt />
                                    </div>
                                )}
                            </div>
                            <div className="template-info">
                                <p className="template-name">{template.name}</p>
                                <span className="template-meta">
                                    {template.category || 'Custom'} • {formatDate(template.updatedAt)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
