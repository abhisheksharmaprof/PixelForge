import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { ElementFactory } from '../../utils/elementFactory';
import { Button } from '../Shared/Button';
import { Accordion } from '../Shared/Accordion';
import { fabric } from 'fabric';
import { FaUpload, FaLink, FaImage, FaSearch } from 'react-icons/fa';
import './ImagesTab.css';

export const ImagesTab: React.FC = () => {
    const { canvas } = useCanvasStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');

    // Upload image from computer
    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files || !canvas) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = async (event) => {
                    try {
                        const imgElement = await ElementFactory.createImage(
                            event.target?.result as string,
                            {
                                left: 100 + (i * 20),
                                top: 100 + (i * 20),
                            }
                        );

                        canvas.add(imgElement);

                        // Auto-scale to fit canvas
                        ElementFactory.scaleImageToFit(imgElement, canvas.width || 800, canvas.height || 600);
                        imgElement.center();
                        imgElement.setCoords();

                        canvas.setActiveObject(imgElement);
                        canvas.renderAll();
                    } catch (error) {
                        console.error('Failed to load image:', error);
                    }
                };

                reader.readAsDataURL(file);
            }
        };

        input.click();
    };

    // Add image from URL
    const handleImageFromURL = async () => {
        if (!canvas || !imageUrlInput) return;

        try {
            const imgElement = await ElementFactory.createImage(imageUrlInput, {
                left: 100,
                top: 100,
            });

            canvas.add(imgElement);

            // Auto-scale to fit canvas
            ElementFactory.scaleImageToFit(imgElement, canvas.width || 800, canvas.height || 600);
            imgElement.center();
            imgElement.setCoords();

            canvas.setActiveObject(imgElement);
            canvas.renderAll();

            setImageUrlInput('');
        } catch (error) {
            console.error('Failed to load image from URL:', error);
            alert('Failed to load image. Please check the URL and try again.');
        }
    };

    // Sample stock images (in real app, this would fetch from an API)
    const sampleImages = [
        'https://via.placeholder.com/300x200/4A90E2/ffffff?text=Sample+1',
        'https://via.placeholder.com/300x200/9B59B6/ffffff?text=Sample+2',
        'https://via.placeholder.com/300x200/2ECC71/ffffff?text=Sample+3',
        'https://via.placeholder.com/300x200/E74C3C/ffffff?text=Sample+4',
    ];

    // Add sample image to canvas
    const addSampleImage = async (url: string) => {
        if (!canvas) return;

        try {
            const imgElement = await ElementFactory.createImage(url, {
                left: 100,
                top: 100,
            });

            canvas.add(imgElement);

            // Auto-scale to fit canvas
            ElementFactory.scaleImageToFit(imgElement, canvas.width || 800, canvas.height || 600);
            imgElement.center();
            imgElement.setCoords();

            canvas.setActiveObject(imgElement);
            canvas.renderAll();
        } catch (error) {
            console.error('Failed to load sample image:', error);
        }
    };

    return (
        <div className="images-tab sidebar-tab-content">
            {/* Upload Section */}
            <Accordion title="Upload" defaultOpen>
                <div className="upload-section">
                    <Button
                        variant="primary"
                        onClick={handleImageUpload}
                        fullWidth
                        icon={<FaUpload />}
                    >
                        Upload from Computer
                    </Button>

                    <div className="drag-drop-zone">
                        <FaImage className="drop-icon" />
                        <p>Or drag and drop images here</p>
                    </div>
                </div>
            </Accordion>

            {/* From URL */}
            <Accordion title="From URL">
                <div className="url-input-section">
                    <input
                        type="text"
                        className="url-input"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleImageFromURL();
                            }
                        }}
                    />
                    <Button
                        variant="primary"
                        onClick={handleImageFromURL}
                        disabled={!imageUrlInput}
                        fullWidth
                        icon={<FaLink />}
                    >
                        Add Image
                    </Button>
                </div>
            </Accordion>

            {/* Stock Images */}
            <Accordion title="Stock Images">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search images..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="stock-images-grid">
                    {sampleImages.map((url, index) => (
                        <button
                            key={index}
                            className="stock-image-card"
                            onClick={() => addSampleImage(url)}
                        >
                            <img src={url} alt={`Sample ${index + 1}`} />
                            <div className="image-overlay">
                                <FaImage /> Add
                            </div>
                        </button>
                    ))}
                </div>

                <div className="stock-info">
                    <p>
                        <strong>Note:</strong> In production, integrate with stock photo
                        APIs like Unsplash, Pexels, or Pixabay for thousands of free images.
                    </p>
                </div>
            </Accordion>

            {/* Image Placeholders */}
            <Accordion title="Placeholders">
                <div className="placeholder-images">
                    <Button
                        variant="outline"
                        onClick={() => {
                            // Add placeholder image box
                            const rect = new fabric.Rect({
                                left: 100,
                                top: 100,
                                width: 300,
                                height: 200,
                                fill: '#f0f0f0',
                                stroke: '#cccccc',
                                strokeWidth: 2,
                                strokeDashArray: [5, 5],
                            });

                            const text = new fabric.Text('Image Placeholder', {
                                left: 250,
                                top: 200,
                                fontSize: 16,
                                fill: '#999999',
                                originX: 'center',
                                originY: 'center',
                            });

                            const group = new fabric.Group([rect, text], {
                                left: 100,
                                top: 100,
                            });

                            (group as any).elementType = 'image-placeholder';
                            canvas?.add(group);
                            canvas?.setActiveObject(group);
                            canvas?.renderAll();
                        }}
                        fullWidth
                    >
                        Add Image Placeholder Box
                    </Button>

                    <p className="helper-text">
                        Useful for templates where images will be added later
                    </p>
                </div>
            </Accordion>

            {/* Quick Shapes as Images */}
            <Accordion title="Decorative Graphics">
                <div className="decorative-graphics-grid">
                    <button
                        className="graphic-item"
                        onClick={() => {
                            // Add decorative graphic
                        }}
                    >
                        <div className="graphic-preview">🎨</div>
                        <span>Art</span>
                    </button>

                    <button className="graphic-item">
                        <div className="graphic-preview">🎓</div>
                        <span>Education</span>
                    </button>

                    <button className="graphic-item">
                        <div className="graphic-preview">🏆</div>
                        <span>Awards</span>
                    </button>

                    <button className="graphic-item">
                        <div className="graphic-preview">⭐</div>
                        <span>Achievement</span>
                    </button>
                </div>
            </Accordion>
        </div>
    );
};
