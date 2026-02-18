import React from 'react';

interface StitchSliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    label?: string;
    showValue?: boolean;
    unit?: string;
    className?: string;
}

export const StitchSlider: React.FC<StitchSliderProps> = ({
    value,
    min,
    max,
    step = 1,
    onChange,
    label,
    showValue = true,
    unit = '',
    className
}) => {
    // Calculate percentage for background fill
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`w-full ${className || ''}`}>
            {label && (
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-[var(--stitch-text-secondary)]">{label}</label>
                </div>
            )}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 h-5 flex items-center group">
                    <div className="absolute w-full h-1.5 bg-[var(--stitch-secondary-dark)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--stitch-primary)] transition-all duration-100"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="absolute h-4 w-4 bg-white rounded-full shadow-md border border-[var(--stitch-border)] pointer-events-none transition-transform duration-100 group-hover:scale-110"
                        style={{ left: `calc(${percentage}% - 8px)` }}
                    />
                </div>

                {showValue && (
                    <span className="text-xs font-medium text-[var(--stitch-text-primary)] min-w-[32px] text-right">
                        {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit}
                    </span>
                )}
            </div>
        </div>
    );
};
