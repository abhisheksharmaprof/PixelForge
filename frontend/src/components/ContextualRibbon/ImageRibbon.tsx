import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useSelectionStore } from '../../store/selectionStore';
import { ElementFactory } from '../../utils/elementFactory';
import { Button } from '../Shared/Button';
import {
    FaImage,
    FaCrop,
    FaArrowsAltH,
    FaArrowsAltV,
    FaRedo,
    FaUndo,
    FaFilter,
    FaAdjust,
    FaTrash,
    FaCopy,
    FaLock,
    FaUnlock,
    FaSync,
    FaSun,
    FaMoon,
    FaTint,
} from 'react-icons/fa';
import './ImageRibbon.css';

export const ImageRibbon: React.FC = () => {
    const { canvas } = useCanvasStore();
    const { selectedObjects } = useSelectionStore();

    // State for image properties
    const [opacity, setOpacity] = useState(100);
    const [isLocked, setIsLocked] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);

    // Adjustment values
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);

    useEffect(() => {
        if (selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
            const obj = selectedObjects[0] as fabric.Image;
            setOpacity(Math.round((obj.opacity || 1) * 100));
            setIsLocked(!!obj.lockMovementX);

            // Reset adjustment values when selecting new image
            setBrightness(0);
            setContrast(0);
            setSaturation(0);
        }
    }, [selectedObjects]);

    const getImg = () => {
        if (canvas && selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
            return selectedObjects[0] as fabric.Image;
        }
        return null;
    };

    const handleReplace = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file || !canvas) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgObj = getImg();
                if (!imgObj) return;
                imgObj.setSrc(ev.target?.result as string, () => {
                    ElementFactory.scaleImageToFit(imgObj, canvas.getWidth(), canvas.getHeight());
                    imgObj.setCoords();
                    canvas.requestRenderAll();
                }, { crossOrigin: 'anonymous' });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    // Direct flip actions
    const handleFlipHorizontal = () => {
        const img = getImg();
        if (!img) return;
        img.set('flipX', !img.flipX);
        canvas?.renderAll();
    };

    const handleFlipVertical = () => {
        const img = getImg();
        if (!img) return;
        img.set('flipY', !img.flipY);
        canvas?.renderAll();
    };

    // Direct rotate actions
    const handleRotate90CW = () => {
        const img = getImg();
        if (!img) return;
        img.rotate((img.angle || 0) + 90);
        canvas?.renderAll();
    };

    const handleRotate90CCW = () => {
        const img = getImg();
        if (!img) return;
        img.rotate((img.angle || 0) - 90);
        canvas?.renderAll();
    };

    const handleOpacity = (val: number) => {
        const img = getImg();
        if (!img) return;
        img.set('opacity', val / 100);
        setOpacity(val);
        canvas?.renderAll();
    };

    const handleDelete = () => {
        const img = getImg();
        if (!img || !canvas) return;
        canvas.remove(img);
        canvas.discardActiveObject();
        canvas.renderAll();
    };

    const handleDuplicate = () => {
        const img = getImg();
        if (!img || !canvas) return;
        img.clone((cloned: fabric.Image) => {
            cloned.set({
                left: (img.left || 0) + 20,
                top: (img.top || 0) + 20,
                evented: true
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
        });
    };

    const handleLock = () => {
        const img = getImg();
        if (!img) return;
        const newLockState = !isLocked;
        img.set({
            lockMovementX: newLockState,
            lockMovementY: newLockState,
            lockRotation: newLockState,
            lockScalingX: newLockState,
            lockScalingY: newLockState,
            hasControls: !newLockState,
            hasBorders: !newLockState,
        });
        setIsLocked(newLockState);
        canvas?.renderAll();
    };

    const handleReset = () => {
        const img = getImg();
        if (!img) return;
        img.filters = [];
        img.applyFilters();
        img.set({
            opacity: 1,
            flipX: false,
            flipY: false,
            angle: 0,
        });
        if (canvas) ElementFactory.scaleImageToFit(img, canvas.getWidth(), canvas.getHeight());
        img.setCoords();
        canvas?.renderAll();
        setOpacity(100);
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
    };

    // Filter presets - Disable WebGL to prevent clipping issues
    const applyFilter = (filterType: string) => {
        const img = getImg();
        if (!img || !canvas) return;

        // CRITICAL: Disable WebGL filtering to prevent image clipping
        // This forces fabric.js to use canvas2d backend which is more reliable
        (fabric as any).filterBackend = new fabric.Canvas2dFilterBackend();

        // Also set large texture size as fallback
        (fabric as any).textureSize = 8192;

        // Disable object caching
        img.objectCaching = false;

        // Store all current properties
        const savedProps = {
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            originX: img.originX,
            originY: img.originY,
        };

        // Initialize and clear filters
        if (!img.filters) img.filters = [];
        img.filters = [];

        // Add the selected filter
        switch (filterType) {
            case 'grayscale':
                img.filters.push(new fabric.Image.filters.Grayscale());
                break;
            case 'sepia':
                img.filters.push(new fabric.Image.filters.Sepia());
                break;
            case 'invert':
                img.filters.push(new fabric.Image.filters.Invert());
                break;
            case 'blur':
                img.filters.push(new fabric.Image.filters.Blur({ blur: 0.1 }));
                break;
            case 'vintage':
                img.filters.push(new fabric.Image.filters.Sepia());
                img.filters.push(new fabric.Image.filters.Brightness({ brightness: -0.1 }));
                break;
            case 'none':
            default:
                break;
        }

        // Apply filters
        img.applyFilters();

        // Restore all properties
        img.set(savedProps);
        img.setCoords();

        canvas.requestRenderAll();
        setShowFilters(false);
    };

    // Adjustment handlers
    const handleBrightness = (val: number) => {
        const img = getImg();
        if (!img) return;
        setBrightness(val);
        applyAdjustments(img, val, contrast, saturation);
    };

    const handleContrast = (val: number) => {
        const img = getImg();
        if (!img) return;
        setContrast(val);
        applyAdjustments(img, brightness, val, saturation);
    };

    const handleSaturation = (val: number) => {
        const img = getImg();
        if (!img) return;
        setSaturation(val);
        applyAdjustments(img, brightness, contrast, val);
    };

    const applyAdjustments = (img: fabric.Image, b: number, c: number, s: number) => {
        if (!canvas) return;

        // CRITICAL: Disable WebGL filtering to prevent image clipping
        (fabric as any).filterBackend = new fabric.Canvas2dFilterBackend();
        (fabric as any).textureSize = 8192;
        img.objectCaching = false;

        // Store current properties
        const savedProps = {
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            originX: img.originX,
            originY: img.originY,
        };

        // Initialize and clear filters
        if (!img.filters) img.filters = [];
        img.filters = [];

        // Add adjustment filters
        if (b !== 0) {
            img.filters.push(new fabric.Image.filters.Brightness({ brightness: b / 100 }));
        }
        if (c !== 0) {
            img.filters.push(new fabric.Image.filters.Contrast({ contrast: c / 100 }));
        }
        if (s !== 0) {
            img.filters.push(new fabric.Image.filters.Saturation({ saturation: s / 100 }));
        }

        // Apply filters
        img.applyFilters();

        // Restore properties
        img.set(savedProps);
        img.setCoords();

        canvas.requestRenderAll();
    };

    return (
        <div className="image-ribbon contextual-ribbon">
            {/* Replace */}
            <div className="ribbon-group">
                <Button size="small" onClick={handleReplace} title="Replace Image">
                    <FaImage /> Replace
                </Button>
            </div>

            <div className="ribbon-separator" />

            {/* Flip & Rotate - Direct Buttons */}
            <div className="ribbon-group">
                <Button size="small" onClick={handleFlipHorizontal} title="Flip Horizontal">
                    <FaArrowsAltH />
                </Button>
                <Button size="small" onClick={handleFlipVertical} title="Flip Vertical">
                    <FaArrowsAltV />
                </Button>
                <Button size="small" onClick={handleRotate90CCW} title="Rotate 90° CCW">
                    <FaUndo />
                </Button>
                <Button size="small" onClick={handleRotate90CW} title="Rotate 90° CW">
                    <FaRedo />
                </Button>
            </div>

            <div className="ribbon-separator" />

            {/* Opacity */}
            <div className="ribbon-group opacity-control">
                <span className="opacity-label">Opacity</span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={(e) => handleOpacity(Number(e.target.value))}
                    style={{ '--value': `${opacity}%` } as React.CSSProperties}
                />
                <span className="opacity-value">{opacity}%</span>
            </div>

            <div className="ribbon-separator" />

            {/* Filters Dropdown */}
            <div className="ribbon-group dropdown-container">
                <Button
                    size="small"
                    onClick={() => { setShowFilters(!showFilters); setShowAdjust(false); }}
                    className={showFilters ? 'active' : ''}
                >
                    <FaFilter /> Filters
                </Button>
                {showFilters && (
                    <div className="ribbon-dropdown">
                        <button onClick={() => applyFilter('none')}>None</button>
                        <button onClick={() => applyFilter('grayscale')}>Grayscale</button>
                        <button onClick={() => applyFilter('sepia')}>Sepia</button>
                        <button onClick={() => applyFilter('invert')}>Invert</button>
                        <button onClick={() => applyFilter('blur')}>Blur</button>
                        <button onClick={() => applyFilter('vintage')}>Vintage</button>
                    </div>
                )}
            </div>

            {/* Adjust Dropdown */}
            <div className="ribbon-group dropdown-container">
                <Button
                    size="small"
                    onClick={() => { setShowAdjust(!showAdjust); setShowFilters(false); }}
                    className={showAdjust ? 'active' : ''}
                >
                    <FaAdjust /> Adjust
                </Button>
                {showAdjust && (
                    <div className="ribbon-dropdown adjust-panel">
                        <div className="adjust-row">
                            <FaSun />
                            <span>Brightness</span>
                            <input
                                type="range"
                                min={-100}
                                max={100}
                                value={brightness}
                                onChange={(e) => handleBrightness(Number(e.target.value))}
                            />
                            <span className="adjust-value">{brightness}</span>
                        </div>
                        <div className="adjust-row">
                            <FaMoon />
                            <span>Contrast</span>
                            <input
                                type="range"
                                min={-100}
                                max={100}
                                value={contrast}
                                onChange={(e) => handleContrast(Number(e.target.value))}
                            />
                            <span className="adjust-value">{contrast}</span>
                        </div>
                        <div className="adjust-row">
                            <FaTint />
                            <span>Saturation</span>
                            <input
                                type="range"
                                min={-100}
                                max={100}
                                value={saturation}
                                onChange={(e) => handleSaturation(Number(e.target.value))}
                            />
                            <span className="adjust-value">{saturation}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="ribbon-separator" />

            {/* Actions */}
            <div className="ribbon-group">
                <Button size="small" onClick={handleReset} title="Reset All">
                    <FaSync />
                </Button>
                <Button size="small" onClick={handleDuplicate} title="Duplicate">
                    <FaCopy />
                </Button>
                {/* Lock/Unlock with visible text */}
                <Button
                    size="small"
                    onClick={handleLock}
                    title={isLocked ? "Unlock" : "Lock"}
                    className={isLocked ? 'locked-btn' : ''}
                >
                    {isLocked ? (
                        <>
                            <FaUnlock /> Unlock
                        </>
                    ) : (
                        <>
                            <FaLock /> Lock
                        </>
                    )}
                </Button>
                <Button size="small" onClick={handleDelete} title="Delete" variant="danger">
                    <FaTrash />
                </Button>
            </div>
        </div>
    );
};
