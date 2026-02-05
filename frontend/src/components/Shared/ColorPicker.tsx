import React from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
    icon?: React.ReactNode;
    allowTransparent?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label, icon }) => {
    return (
        <div className="color-picker">
            {label && <label className="color-picker-label">{label}</label>}
            <div className="color-input-wrapper">
                {icon && <span className="color-icon">{icon}</span>}
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-input"
                />
                <div className="color-preview" style={{ backgroundColor: color }} />
            </div>
        </div>
    );
};
