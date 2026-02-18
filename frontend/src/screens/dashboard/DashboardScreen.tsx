import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTemplateStore, Template } from '../../store/templateStore';
import { StitchButton } from '../../components/common/StitchButton';
import { StitchCard } from '../../components/common/StitchCard';
import { StitchContainer, StitchGrid, StitchFlex } from '../../components/common/StitchLayout';
import { Plus, Search, Layout, MoreHorizontal, FileBox, Image, Database } from 'lucide-react';

const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const { savedTemplates, loadTemplates, isLoading, deleteTemplate, saveTemplate } = useTemplateStore();
    const [activeTab, setActiveTab] = React.useState('all');
    const [menuState, setMenuState] = React.useState<{ id: string; x: number; y: number; placement: 'top' | 'bottom' } | null>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const filteredTemplates = savedTemplates.filter(t => {
        if (activeTab === 'templates') return t.category === 'Template';
        if (activeTab === 'projects') return t.category !== 'Template';
        return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuState) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuState(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuState]);

    // Close menu on scroll
    useEffect(() => {
        if (!menuState) return;
        const handleScroll = () => setMenuState(null);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [menuState]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    const handleEdit = (id: string) => {
        navigate(`/editor/${id}`);
    };

    const handleCreate = () => {
        navigate('/editor/new');
    };



    const handleDataSources = () => {
        navigate('/data-sources');
    };

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (menuState && menuState.id === id) {
            setMenuState(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const MENU_HEIGHT = 200; // Approx height

            if (spaceBelow < MENU_HEIGHT) {
                // Open upwards
                setMenuState({
                    id,
                    x: rect.right,
                    y: window.innerHeight - rect.top + 4, // y becomes 'bottom' value
                    placement: 'top'
                });
            } else {
                // Open downwards
                setMenuState({
                    id,
                    x: rect.right,
                    y: rect.bottom + 4, // y becomes 'top' value
                    placement: 'bottom'
                });
            }
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuState(null);
        if (window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
            await deleteTemplate(id);
        }
    };

    const handleRename = async (template: Template, e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuState(null);
        const newName = window.prompt('Enter new name:', template.name);
        if (newName && newName.trim() !== '' && newName !== template.name) {
            const updated = { ...template, name: newName };
            await saveTemplate(updated);
        }
    };

    const handleDuplicate = async (template: Template, e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuState(null);
        const newTemplate = { ...template, id: '', name: `${template.name} (Copy)` };
        await saveTemplate(newTemplate);
    };

    // Find the template for the open menu
    const menuTemplate = menuState ? savedTemplates.find(t => t.id === menuState.id) : null;

    // Render context menu via portal so it's never clipped
    const contextMenu = menuState && menuTemplate ? ReactDOM.createPortal(
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: menuState.placement === 'bottom' ? menuState.y : 'auto',
                bottom: menuState.placement === 'top' ? menuState.y : 'auto',
                left: menuState.x - 176,
                zIndex: 99999,
                width: '176px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                padding: '4px 0',
                display: 'flex',
                flexDirection: 'column' as const,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                style={{ textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={(e) => { e.stopPropagation(); handleEdit(menuState.id); }}
            >
                ✏️ Edit Design
            </button>
            <button
                style={{ textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={(e) => handleRename(menuTemplate, e)}
            >
                📝 Rename
            </button>
            <button
                style={{ textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={(e) => handleDuplicate(menuTemplate, e)}
            >
                📋 Duplicate
            </button>
            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
            <button
                style={{ textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={(e) => handleDelete(menuState.id, e)}
            >
                🗑️ Delete
            </button>
        </div>,
        document.body
    ) : null;

    return (
        <div className="min-h-screen bg-[var(--stitch-background)]">
            {contextMenu}

            {/* Top Navigation */}
            <nav className="bg-[var(--stitch-surface)] border-b border-[var(--stitch-border)] sticky top-0 z-10">
                <StitchContainer className="h-16 flex items-center justify-between">
                    <StitchFlex className="gap-8">
                        <div className="font-bold text-2xl text-[var(--stitch-primary)]">PixelForge</div>
                        <div className="hidden md:flex gap-6 text-sm font-medium text-[var(--stitch-text-secondary)]">
                            <a href="#" className="text-[var(--stitch-text-primary)]">Home</a>
                            <a href="#" className="hover:text-[var(--stitch-text-primary)] transition-colors">Projects</a>
                            <a href="#" className="hover:text-[var(--stitch-text-primary)] transition-colors">Templates</a>
                        </div>
                    </StitchFlex>
                    <StitchFlex className="gap-4">
                        <div className="relative hidden sm:block">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stitch-text-tertiary)] pointer-events-none">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search designs..."
                                className="pl-10 pr-4 py-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-full text-sm focus:outline-none focus:border-[var(--stitch-primary)] w-64 transition-colors text-[var(--stitch-text-primary)]"
                            />
                        </div>
                        <StitchButton size="sm" onClick={handleCreate}>
                            <Plus size={16} className="mr-2" /> Create Design
                        </StitchButton>
                        <div className="w-8 h-8 bg-[var(--stitch-primary-light)] rounded-full flex items-center justify-center text-[var(--stitch-primary)] font-bold text-xs ring-2 ring-white">
                            PF
                        </div>
                    </StitchFlex>
                </StitchContainer>
            </nav>

            {/* Main Content */}
            <StitchContainer className="py-8">
                {/* Welcome Section */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-[var(--stitch-text-primary)] mb-2">Welcome back, get creative!</h1>
                    <p className="text-[var(--stitch-text-secondary)] mb-6">What will you design today?</p>

                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {['Doc', 'Whiteboard', 'Presentation', 'Social'].map((item) => (
                            <StitchCard key={item} hoverEffect className="min-w-[120px] flex flex-col items-center justify-center py-6 cursor-pointer border-transparent shadow-sm bg-[var(--stitch-surface)] hover:bg-[var(--stitch-surface-hover)] transition-all">
                                <div className="w-12 h-12 rounded-full bg-[var(--stitch-primary-light)] flex items-center justify-center text-[var(--stitch-primary)] mb-3">
                                    <Layout size={24} />
                                </div>
                                <span className="font-medium text-[var(--stitch-text-secondary)]">{item}</span>
                            </StitchCard>
                        ))}



                        {/* Data Sources Card */}
                        <StitchCard
                            hoverEffect
                            onClick={handleDataSources}
                            className="min-w-[120px] flex flex-col items-center justify-center py-6 cursor-pointer border-transparent shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all ring-1 ring-blue-200/50"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-3 shadow-md">
                                <Database size={24} />
                            </div>
                            <span className="font-semibold text-blue-700">Data Sources</span>
                        </StitchCard>
                    </div>
                </div>



                {/* Recent Designs */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-4 border-b border-[var(--stitch-border)]">
                            {[{ id: 'all', label: 'All Designs' }, { id: 'templates', label: 'Templates' }, { id: 'projects', label: 'My Projects' }].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                        ? 'text-[var(--stitch-primary)]'
                                        : 'text-[var(--stitch-text-secondary)] hover:text-[var(--stitch-text-primary)]'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--stitch-primary)] rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <StitchButton variant="ghost" size="sm">View all</StitchButton>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="h-64 bg-[var(--stitch-surface-elevated)] rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : savedTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[var(--stitch-text-tertiary)] bg-[var(--stitch-surface)] rounded-xl border border-dashed border-[var(--stitch-border)]">
                            <FileBox size={48} strokeWidth={1} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium text-[var(--stitch-text-primary)]">No designs yet</p>
                            <p className="text-sm mb-6">Start creating your first masterpiece!</p>
                            <StitchButton onClick={handleCreate}>
                                <Plus size={16} className="mr-2" />
                                Create New Design
                            </StitchButton>
                        </div>
                    ) : (
                        <StitchGrid cols={4} className="gap-6">
                            {filteredTemplates.map((project: Template) => (
                                <StitchCard key={project.id} className="p-0 overflow-hidden group cursor-pointer border border-[var(--stitch-border)] shadow-sm hover:shadow-md transition-all h-full flex flex-col" hoverEffect onClick={() => handleEdit(project.id)}>
                                    <div className="h-40 bg-[var(--stitch-background)] relative overflow-hidden group-hover:opacity-95 transition-opacity">
                                        {project.thumbnail ? (
                                            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[var(--stitch-surface-elevated)] text-[var(--stitch-text-tertiary)]">
                                                <Image size={40} strokeWidth={1} />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-[1px]">
                                            <StitchButton size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEdit(project.id); }}>Edit</StitchButton>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col justify-between bg-[var(--stitch-surface)]">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-[var(--stitch-text-primary)] truncate pr-2 flex-1" title={project.name}>{project.name}</h3>
                                            <button
                                                className="text-[var(--stitch-text-tertiary)] hover:text-[var(--stitch-text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--stitch-surface-hover)]"
                                                onClick={(e) => toggleMenu(project.id, e)}
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[var(--stitch-text-tertiary)]">
                                            {project.updatedAt ? `Edited ${formatDate(project.updatedAt)}` : 'Recently'}
                                        </p>
                                    </div>
                                </StitchCard>
                            ))}
                        </StitchGrid>
                    )}
                </div>
            </StitchContainer>
        </div>
    );
};

export default DashboardScreen;
