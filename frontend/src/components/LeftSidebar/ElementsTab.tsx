import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { fabric } from 'fabric';
import {
    Square, Circle, Triangle, Star, Minus, ArrowRight, MousePointerClick,
    Hexagon, Diamond, Heart, PlayCircle, Zap, BoxSelect, CircleDashed, Search, ChevronDown, Image as ImageIcon
} from 'lucide-react';

export const ElementsTab: React.FC = () => {
    const { canvas } = useCanvasStore();

    // Helper to add shape
    const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'polygon', options: any) => {
        if (!canvas) return;
        let shape;

        const defaultOptions = {
            left: 100,
            top: 100,
            fill: '#6366f1', // Primary
            stroke: '#1e293b', // Slate 800
            strokeWidth: 2,
            ...options
        };

        switch (shapeType) {
            case 'rect':
                shape = new fabric.Rect({ ...defaultOptions, width: 100, height: 100, rx: 8, ry: 8 });
                break;
            case 'circle':
                shape = new fabric.Circle({ ...defaultOptions, radius: 50 });
                break;
            case 'triangle':
                shape = new fabric.Triangle({ ...defaultOptions, width: 100, height: 100 });
                break;
            case 'polygon': // For custom shapes like stars
                // Handled in specific functions usually
                break;
        }

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        }
    };

    const addPolygon = (points: any[], options: any) => {
        if (!canvas) return;
        const shape = new fabric.Polygon(points, {
            left: 100,
            top: 100,
            fill: '#f59e0b',
            stroke: '#1e293b',
            strokeWidth: 2,
            ...options
        });
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();
    }

    // --- Shapes ---

    const addHollowRect = () => addShape('rect', { fill: 'transparent', strokeWidth: 4 });
    const addHollowCircle = () => addShape('circle', { fill: 'transparent', strokeWidth: 4 });
    const addHollowTriangle = () => addShape('triangle', { fill: 'transparent', strokeWidth: 4 });

    const addDashedCircle = () => addShape('circle', {
        fill: 'transparent',
        strokeWidth: 3,
        strokeDashArray: [10, 10]
    });

    // --- Lines ---

    const addLine = (dashed = false) => {
        if (!canvas) return;
        const line = new fabric.Line([50, 50, 200, 50], {
            left: 100,
            top: 100,
            stroke: '#334155',
            strokeWidth: 4,
            strokeLineCap: 'round',
            strokeDashArray: dashed ? [10, 10] : undefined
        });
        canvas.add(line);
        canvas.setActiveObject(line);
        canvas.renderAll();
    };

    const addArrow = () => {
        if (!canvas) return;
        // Simplified arrow using Path for better scaling
        const path = new fabric.Path('M 0 0 L 100 0 L 100 -10 L 120 10 L 100 30 L 100 20 L 0 20 Z', {
            left: 100,
            top: 100,
            fill: '#10b981',
            stroke: '#065f46',
            strokeWidth: 1,
            scaleX: 0.8,
            scaleY: 0.8
        });
        canvas.add(path);
        canvas.setActiveObject(path);
        canvas.renderAll();
    };

    const categories = [
        { label: 'Shapes', icon: Hexagon, color: 'bg-teal-100 text-teal-600' },
        { label: 'Graphics', icon: Circle, color: 'bg-yellow-100 text-yellow-600' }, // Placeholder icon
        { label: 'Animations', icon: PlayCircle, color: 'bg-lime-100 text-lime-600' },
        { label: 'Photos', icon: ImageIcon, color: 'bg-blue-100 text-blue-600' },
        { label: 'Videos', icon: PlayCircle, color: 'bg-purple-100 text-purple-600' },
        { label: 'Audio', icon: Zap, color: 'bg-pink-100 text-pink-600' }, // Placeholder icon
    ];

    return (
        <div className="flex flex-col h-full bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Elements</h3>

            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => addShape('rect', { fill: '#3b82f6' })}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                    title="Square"
                >
                    <Square size={24} />
                    <span className="text-[10px] mt-1">Square</span>
                </button>

                <button
                    onClick={() => addShape('circle', { fill: '#ef4444' })}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                    title="Circle"
                >
                    <Circle size={24} />
                    <span className="text-[10px] mt-1">Circle</span>
                </button>

                <button
                    onClick={() => addShape('triangle', { fill: '#10b981' })}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                    title="Triangle"
                >
                    <Triangle size={24} />
                    <span className="text-[10px] mt-1">Triangle</span>
                </button>

                <button
                    onClick={() => addLine(false)}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                    title="Line"
                >
                    <Minus size={24} />
                    <span className="text-[10px] mt-1">Line</span>
                </button>

                <button
                    onClick={addArrow}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-slate-600"
                    title="Arrow"
                >
                    <ArrowRight size={24} />
                    <span className="text-[10px] mt-1">Arrow</span>
                </button>
            </div>
        </div>
    );
};

// Simplified Element Button for the grid
const ElementBtn: React.FC<{ icon: any, label: string, onClick: () => void, color?: string }> = ({ icon: Icon, label, onClick, color }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 group aspect-square"
        title={label || 'Element'}
    >
        <Icon size={24} className="group-hover:scale-110 transition-transform" style={{ color: color || '#64748b' }} fill={color ? "currentColor" : "none"} />
    </button>
);
