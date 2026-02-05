import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import './CanvasGrid.css';

export const CanvasGrid: React.FC = () => {
    const { canvasSize, gridSize, gridColor } = useCanvasStore();

    const horizontalLines = Math.ceil(canvasSize.height / gridSize);
    const verticalLines = Math.ceil(canvasSize.width / gridSize);

    return (
        <svg
            className="canvas-grid"
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ pointerEvents: 'none' }}
        >
            {/* Horizontal lines */}
            {Array.from({ length: horizontalLines }).map((_, i) => (
                <line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * gridSize}
                    x2={canvasSize.width}
                    y2={i * gridSize}
                    stroke={gridColor}
                    strokeWidth={1}
                    opacity={0.2}
                />
            ))}

            {/* Vertical lines */}
            {Array.from({ length: verticalLines }).map((_, i) => (
                <line
                    key={`v-${i}`}
                    x1={i * gridSize}
                    y1={0}
                    x2={i * gridSize}
                    y2={canvasSize.height}
                    stroke={gridColor}
                    strokeWidth={1}
                    opacity={0.2}
                />
            ))}
        </svg>
    );
};
