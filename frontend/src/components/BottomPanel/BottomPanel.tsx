import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import {
    FaEye,
    FaEyeSlash,
    FaLock,
    FaUnlock,
    FaLayerGroup,
    FaClock,
    FaHistory,
    FaComments,
    FaChevronUp,
    FaChevronDown,
    FaTrash,
    FaCopy,
} from 'react-icons/fa';
import { useUIStore } from '../../store/uiStore';
import './BottomPanel.css';

type TabType = 'layers' | 'timeline' | 'history' | 'comments';

export const BottomPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('layers');
    const { canvas } = useCanvasStore();
    const { toggleBottomPanel } = useUIStore();

    const tabs = [
        { id: 'layers' as TabType, icon: <FaLayerGroup />, label: 'Layers' },
        { id: 'timeline' as TabType, icon: <FaClock />, label: 'Timeline' },
        { id: 'history' as TabType, icon: <FaHistory />, label: 'Version History' },
        { id: 'comments' as TabType, icon: <FaComments />, label: 'Comments' },
    ];

    const objects = canvas?.getObjects() || [];

    const renderLayersTab = () => (
        <div className="layers-container">
            <div className="layers-toolbar">
                <button className="layer-action-btn" title="Move Up">
                    <FaChevronUp />
                </button>
                <button className="layer-action-btn" title="Move Down">
                    <FaChevronDown />
                </button>
                <button className="layer-action-btn" title="Duplicate">
                    <FaCopy />
                </button>
                <button className="layer-action-btn delete" title="Delete">
                    <FaTrash />
                </button>
            </div>
            <div className="layers-list">
                {objects.length === 0 ? (
                    <div className="layers-empty">No layers yet</div>
                ) : (
                    objects.map((obj, index) => (
                        <div
                            key={index}
                            className={`layer-item ${obj === canvas?.getActiveObject() ? 'selected' : ''}`}
                            onClick={() => {
                                canvas?.setActiveObject(obj);
                                canvas?.renderAll();
                            }}
                        >
                            <button className="layer-visibility">
                                {obj.visible !== false ? <FaEye /> : <FaEyeSlash />}
                            </button>
                            <span className="layer-name">
                                {(obj as any).name || `${obj.type} ${index + 1}`}
                            </span>
                            <div className="layer-opacity" onClick={(e) => e.stopPropagation()} style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={Math.round((obj.opacity || 1) * 100)}
                                    onChange={(e) => {
                                        obj.set('opacity', Number(e.target.value) / 100);
                                        canvas?.renderAll();
                                    }}
                                    style={{ width: '60px' }}
                                    title={`Opacity: ${Math.round((obj.opacity || 1) * 100)}%`}
                                />
                            </div>
                            <button className="layer-lock">
                                {obj.selectable !== false ? <FaUnlock /> : <FaLock />}
                            </button>
                        </div>
                    )).reverse()
                )}
            </div>
        </div>
    );

    const renderTimelineTab = () => (
        <div className="timeline-container">
            <div className="timeline-placeholder">
                <FaClock className="placeholder-icon" />
                <span>Animation Timeline</span>
                <small>Timeline features coming soon</small>
            </div>
        </div>
    );

    const renderHistoryTab = () => (
        <div className="history-container">
            <div className="timeline-placeholder">
                <FaHistory className="placeholder-icon" />
                <span>Version History</span>
                <small>Track changes and restore previous versions</small>
            </div>
        </div>
    );

    const renderCommentsTab = () => (
        <div className="comments-container">
            <div className="timeline-placeholder">
                <FaComments className="placeholder-icon" />
                <span>Comments</span>
                <small>Collaborate with team comments</small>
            </div>
        </div>
    );

    return (
        <div className="bottom-panel">
            {/* Panel Header with Tabs */}
            <div className="panel-header">
                <div className="panel-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <button className="panel-collapse-btn" onClick={toggleBottomPanel} title="Collapse Panel">
                    <FaChevronDown />
                </button>
            </div>

            {/* Panel Content */}
            <div className="panel-content">
                {activeTab === 'layers' && renderLayersTab()}
                {activeTab === 'timeline' && renderTimelineTab()}
                {activeTab === 'history' && renderHistoryTab()}
                {activeTab === 'comments' && renderCommentsTab()}
            </div>
        </div>
    );
};
