import React from 'react';
import { Palette } from 'lucide-react';

interface StitchColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
    className?: string;
    allowTransparent?: boolean;
}

export const StitchColorPicker: React.FC<StitchColorPickerProps> = ({
    color,
    onChange,
    label,
    className
}) => {
    return (
        <div className={`flex flex-col gap-2 ${className || ''}`}>
            {label && (
                <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">{label}</label>
            )}
            <div className="relative group">
                <button
                    className="flex items-center gap-3 w-full p-2 bg-[var(--stitch-background)] border border-[var(--stitch-border)] rounded-lg hover:border-[var(--stitch-primary)] transition-all duration-200"
                    onClick={() => document.getElementById(`color-input-${label || 'default'}`)?.click()}
                >
                    <div
                        className="w-6 h-6 rounded border border-[var(--stitch-border)] shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-[var(--stitch-text-primary)] font-mono">{color}</span>
                    <Palette size={14} className="ml-auto text-[var(--stitch-text-tertiary)]" />
                </button>
                <input
                    id={`color-input-${label || 'default'}`}
                    type="color"
                    value={/^#[0-9A-F]{6}$/i.test(color) ? color : '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
            </div>
        </div>
    );
};
