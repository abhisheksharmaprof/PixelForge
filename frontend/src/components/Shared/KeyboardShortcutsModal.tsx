import React, { useState, useMemo } from 'react';
import { FaSearch, FaKeyboard, FaTimes } from 'react-icons/fa';
import { KeyboardShortcut, KeyboardShortcutsManager } from '../../utils/keyboardShortcuts';
import './KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: Record<string, KeyboardShortcut[]>;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
    isOpen,
    onClose,
    shortcuts,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter shortcuts based on search
    const filteredShortcuts = useMemo(() => {
        if (!searchQuery.trim()) return shortcuts;

        return Object.entries(shortcuts).reduce((acc, [category, items]) => {
            const filtered = items.filter(item =>
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                KeyboardShortcutsManager.formatShortcut(item).toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length > 0) {
                acc[category] = filtered;
            }
            return acc;
        }, {} as Record<string, KeyboardShortcut[]>);
    }, [shortcuts, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="keyboard-shortcuts-overlay" onClick={onClose}>
            <div className="keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="shortcuts-header">
                    <div className="header-title">
                        <FaKeyboard />
                        <h2>Keyboard Shortcuts</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* Search */}
                <div className="shortcuts-search">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search shortcuts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Shortcuts List */}
                <div className="shortcuts-list">
                    {Object.entries(filteredShortcuts).map(([category, items]) => (
                        <div key={category} className="shortcuts-category">
                            <h3 className="category-title">{category}</h3>
                            <div className="shortcuts-table">
                                {items.map((shortcut, index) => (
                                    <div key={index} className="shortcut-row">
                                        <div className="shortcut-description">
                                            {shortcut.description}
                                        </div>
                                        <div className="shortcut-keys">
                                            {KeyboardShortcutsManager.formatShortcut(shortcut)
                                                .split(' + ')
                                                .map((key, i) => (
                                                    <React.Fragment key={i}>
                                                        {i > 0 && <span className="key-separator">+</span>}
                                                        <kbd className="key">{key}</kbd>
                                                    </React.Fragment>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {Object.keys(filteredShortcuts).length === 0 && (
                        <div className="no-results">
                            <p>No shortcuts found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="shortcuts-tips">
                    <h4>Tips:</h4>
                    <ul>
                        <li>Press <kbd>Ctrl</kbd> + <kbd>/</kbd> to open this dialog anytime</li>
                        <li>Most shortcuts work with <kbd>Cmd</kbd> on Mac instead of <kbd>Ctrl</kbd></li>
                        <li>Use arrow keys to move selected objects precisely</li>
                        <li>Hold <kbd>Shift</kbd> with arrow keys for larger movements (10px)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
