import React from 'react';
import './Checkbox.css';

interface CheckboxProps {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    checked,
    onChange,
    disabled = false,
    className = '',
}) => {
    return (
        <label className={`custom-checkbox-container ${disabled ? 'disabled' : ''} ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <span className="checkmark"></span>
            {label && <span className="checkbox-label">{label}</span>}
        </label>
    );
};
