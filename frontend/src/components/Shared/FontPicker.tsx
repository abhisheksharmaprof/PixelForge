import React from 'react';
import './FontPicker.css';

interface FontPickerProps {
    value: string;
    onChange: (font: string) => void;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange }) => {
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Inter', 'Roboto', 'Poppins', 'Open Sans', 'Montserrat'];

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-picker"
        >
            {fonts.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                </option>
            ))}
        </select>
    );
};
