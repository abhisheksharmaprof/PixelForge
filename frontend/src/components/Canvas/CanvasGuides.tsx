import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import './CanvasGuides.css';

export const CanvasGuides: React.FC = () => {
    const { guides, removeGuide } = useCanvasStore();

    return (
        <div className="canvas-guides">
            {guides.map(guide => (
                <div
                    key={guide.id}
                    className={`guide ${guide.type}`}
                    style={{
                        [guide.type === 'horizontal' ? 'top' : 'left']: `${guide.position}px`,
                    }}
                    draggable
                >
                    <button
                        className="guide-remove"
                        onClick={() => removeGuide(guide.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};
