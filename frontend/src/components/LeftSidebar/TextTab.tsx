import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { fabric } from 'fabric';
import { FaFont, FaHeading, FaAlignLeft, FaQuoteRight } from 'react-icons/fa';
import './TextTab.css';

export const TextTab: React.FC = () => {
    const { canvas } = useCanvasStore();

    const addText = (type: 'heading' | 'subheading' | 'body' | 'caption') => {
        if (!canvas) {
            console.error('Canvas not available');
            return;
        }

        const textConfig = {
            heading: { text: 'Add a heading', fontSize: 36, fontWeight: 'bold' as const },
            subheading: { text: 'Add a subheading', fontSize: 24, fontWeight: '500' as const },
            body: { text: 'Add body text here', fontSize: 16, fontWeight: 'normal' as const },
            caption: { text: 'Add a caption', fontSize: 12, fontWeight: 'normal' as const },
        };

        const config = textConfig[type];

        // Create textbox with proper options
        const textbox = new fabric.Textbox(config.text, {
            left: 50,
            top: 50,
            width: 300,
            fontFamily: 'Arial',
            fontSize: config.fontSize,
            fontWeight: config.fontWeight,
            fill: '#333333',
            textAlign: 'left',
            lineHeight: 1.2,
        });

        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.requestRenderAll();

        console.log('Text added:', textbox);
    };

    return (
        <div className="text-tab sidebar-tab-content">
            <div className="sidebar-header">
                <h3>Text</h3>
            </div>

            <div className="text-options">
                <button className="text-option" onClick={() => addText('heading')}>
                    <FaHeading className="option-icon" />
                    <div className="option-info">
                        <span className="option-title">Heading</span>
                        <span className="option-preview heading-preview">Add a heading</span>
                    </div>
                </button>

                <button className="text-option" onClick={() => addText('subheading')}>
                    <FaFont className="option-icon" />
                    <div className="option-info">
                        <span className="option-title">Subheading</span>
                        <span className="option-preview subheading-preview">Add a subheading</span>
                    </div>
                </button>

                <button className="text-option" onClick={() => addText('body')}>
                    <FaAlignLeft className="option-icon" />
                    <div className="option-info">
                        <span className="option-title">Body Text</span>
                        <span className="option-preview body-preview">Add body text</span>
                    </div>
                </button>

                <button className="text-option" onClick={() => addText('caption')}>
                    <FaQuoteRight className="option-icon" />
                    <div className="option-info">
                        <span className="option-title">Caption</span>
                        <span className="option-preview caption-preview">Add a caption</span>
                    </div>
                </button>
            </div>

            <div className="text-tip">
                <p>💡 Click on any text option to add it to your canvas, then double-click to edit.</p>
            </div>
        </div>
    );
};
