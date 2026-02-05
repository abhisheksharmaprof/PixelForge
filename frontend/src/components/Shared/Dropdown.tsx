import React from 'react';
import './Dropdown.css';

interface DropdownOption {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

interface DropdownProps {
    value?: string | number;
    onChange?: (value: string | number) => void;
    options: DropdownOption[];
    width?: number;
    trigger?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, onChange, options, width, trigger }) => {
    return (
        <div className="dropdown" style={{ width: width ? `${width}px` : 'auto' }}>
            {trigger ? (
                <div className="dropdown-trigger">{trigger}</div>
            ) : (
                <select
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="dropdown-select"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};
