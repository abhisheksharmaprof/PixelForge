import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import './CanvasRuler.css';

interface CanvasRulerProps {
    orientation: 'horizontal' | 'vertical';
}

export const CanvasRuler: React.FC<CanvasRulerProps> = ({ orientation }) => {
    const { canvasSize, rulerUnit, zoom } = useCanvasStore();

    const convertPixels = (pixels: number): number => {
        switch (rulerUnit) {
            case 'mm':
                return pixels / 3.7795275591; // 1mm = 3.78px at 96dpi
            case 'cm':
                return pixels / 37.795275591; // 1cm = 37.8px at 96dpi
            case 'inch':
                return pixels / 96; // 96px = 1 inch at 96dpi
            default:
                return pixels;
        }
    };

    const size = orientation === 'horizontal' ? canvasSize.width : canvasSize.height;
    const convertedSize = convertPixels(size);
    const interval = rulerUnit === 'px' ? 100 : 1;
    const marks = Math.ceil(convertedSize / interval);

    return (
        <div className={`canvas-ruler ${orientation}`}>
            <div className="ruler-marks">
                {Array.from({ length: marks }).map((_, i) => {
                    const value = i * interval;
                    const position = (value / convertedSize) * 100;

                    return (
                        <div
                            key={i}
                            className="ruler-mark"
                            style={{
                                [orientation === 'horizontal' ? 'left' : 'top']: `${position}%`,
                            }}
                        >
                            <div className="ruler-tick" />
                            <div className="ruler-label">{value}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
