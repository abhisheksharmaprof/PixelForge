import React from 'react';
import './Slider.css';

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    width?: number;
    label?: string;
    showValue?: boolean;
    unit?: string;
}

export const Slider: React.FC<SliderProps> = ({
    value,
    min,
    max,
    step = 1,
    onChange,
    width,
    label,
    showValue = true,
    unit = ''
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="slider-container" style={{ width: width ? `${width}px` : '100%' }}>
            {label && <span className="slider-label">{label}</span>}
            <div className="slider-track-wrapper">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="slider"
                    style={{
                        background: `linear-gradient(to right, #00C4CC ${percentage}%, #0f3460 ${percentage}%)`
                    }}
                />
            </div>
            {showValue && (
                <span className="slider-value">
                    {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit}
                </span>
            )}
        </div>
    );
};
