import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

export interface ContextMenuItem {
    label: string;
    action: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
    separator?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    // Adjust position if menu goes off screen
    const style: React.CSSProperties = {
        top: y,
        left: x,
    };

    return (
        <div className="context-menu" ref={menuRef} style={style}>
            {items.map((item, index) => (
                item.separator ? (
                    <div key={index} className="context-menu-separator" />
                ) : (
                    <button
                        key={index}
                        className={`context-menu-item ${item.danger ? 'danger' : ''}`}
                        onClick={() => {
                            if (!item.disabled) {
                                item.action();
                                onClose();
                            }
                        }}
                        disabled={item.disabled}
                    >
                        {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                        <span className="context-menu-label">{item.label}</span>
                    </button>
                )
            ))}
        </div>
    );
};
