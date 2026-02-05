import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { fabric } from 'fabric';
import { FaSquare, FaCircle, FaPlay, FaStar, FaMinus, FaArrowRight } from 'react-icons/fa';
import './ElementsTab.css';

export const ElementsTab: React.FC = () => {
    const { canvas } = useCanvasStore();

    const addRectangle = () => {
        if (!canvas) return;
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            width: 150,
            height: 100,
            fill: '#00C4CC',
            stroke: '#0f3460',
            strokeWidth: 2,
            rx: 8,
            ry: 8,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
    };

    const addCircle = () => {
        if (!canvas) return;
        const circle = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 60,
            fill: '#7D2AE8',
            stroke: '#0f3460',
            strokeWidth: 2,
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.renderAll();
    };

    const addTriangle = () => {
        if (!canvas) return;
        const triangle = new fabric.Triangle({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            fill: '#FF6B6B',
            stroke: '#0f3460',
            strokeWidth: 2,
        });
        canvas.add(triangle);
        canvas.setActiveObject(triangle);
        canvas.renderAll();
    };

    const addLine = () => {
        if (!canvas) return;
        const line = new fabric.Line([50, 50, 200, 50], {
            left: 100,
            top: 100,
            stroke: '#333333',
            strokeWidth: 3,
        });
        canvas.add(line);
        canvas.setActiveObject(line);
        canvas.renderAll();
    };

    const addStar = () => {
        if (!canvas) return;
        const points = [];
        const outerRadius = 50;
        const innerRadius = 25;
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        const star = new fabric.Polygon(points, {
            left: 100,
            top: 100,
            fill: '#FFD93D',
            stroke: '#0f3460',
            strokeWidth: 2,
        });
        canvas.add(star);
        canvas.setActiveObject(star);
        canvas.renderAll();
    };

    const addArrow = () => {
        if (!canvas) return;
        const arrow = new fabric.Polygon([
            { x: 0, y: 10 },
            { x: 60, y: 10 },
            { x: 60, y: 0 },
            { x: 80, y: 15 },
            { x: 60, y: 30 },
            { x: 60, y: 20 },
            { x: 0, y: 20 }
        ], {
            left: 100,
            top: 100,
            fill: '#4ECDC4',
            stroke: '#0f3460',
            strokeWidth: 1,
        });
        canvas.add(arrow);
        canvas.setActiveObject(arrow);
        canvas.renderAll();
    };

    return (
        <div className="elements-tab sidebar-tab-content">
            <div className="sidebar-header">
                <h3>Elements</h3>
            </div>

            <div className="element-section">
                <h4>Shapes</h4>
                <div className="elements-grid">
                    <button className="element-btn" onClick={addRectangle} title="Rectangle">
                        <FaSquare />
                        <span>Rectangle</span>
                    </button>
                    <button className="element-btn" onClick={addCircle} title="Circle">
                        <FaCircle />
                        <span>Circle</span>
                    </button>
                    <button className="element-btn" onClick={addTriangle} title="Triangle">
                        <FaPlay />
                        <span>Triangle</span>
                    </button>
                    <button className="element-btn" onClick={addStar} title="Star">
                        <FaStar />
                        <span>Star</span>
                    </button>
                </div>
            </div>

            <div className="element-section">
                <h4>Lines & Arrows</h4>
                <div className="elements-grid">
                    <button className="element-btn" onClick={addLine} title="Line">
                        <FaMinus />
                        <span>Line</span>
                    </button>
                    <button className="element-btn" onClick={addArrow} title="Arrow">
                        <FaArrowRight />
                        <span>Arrow</span>
                    </button>
                </div>
            </div>

            <div className="elements-tip">
                <p>💡 Click any element to add it to your canvas.</p>
            </div>
        </div>
    );
};
