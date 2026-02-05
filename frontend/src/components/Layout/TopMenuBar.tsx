import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useTemplateStore } from '../../store/templateStore';
import { useDataStore } from '../../store/dataStore';
import { useUIStore } from '../../store/uiStore';
import { useHistoryStore } from '../../store/historyStore';
import { CanvasHelpers } from '../../utils/canvasHelpers';
import { ElementFactory } from '../../utils/elementFactory';
import { generatePDF, generateWord, downloadFile } from '../../utils/exportService';
import { fabric } from 'fabric';
import {
    FaFile,
    FaFolderOpen,
    FaSave,
    FaDownload,
    FaUpload,
    FaPrint,
    FaUndo,
    FaRedo,
    FaCut,
    FaCopy,
    FaPaste,
    FaTrash,
    FaSearch,
    FaEye,
    FaExpand,
    FaCompress,
    FaRuler,
    FaTh,
    FaAlignLeft,
    FaLayerGroup,
    FaImage,
    FaFont,
    FaShapes,
    FaTable,
    FaQrcode,
    FaCog,
    FaQuestion,
    FaKeyboard,
    FaBook,
    FaRocket,
    FaLink,
} from 'react-icons/fa';
import './TopMenuBar.css';

interface MenuItem {
    id?: string;
    label?: string;
    items?: MenuItem[];
    icon?: React.ReactNode;
    shortcut?: string;
    action?: () => void;
    separator?: boolean;
    disabled?: boolean;
    submenu?: MenuItem[];
    checked?: boolean;
}

export const TopMenuBar: React.FC = () => {
    const { canvas } = useCanvasStore();
    const {
        currentTemplate,
        saveTemplate,
        saveTemplateAs,
        newTemplate,
        openTemplate,
        exportTemplate,
        importTemplate,
    } = useTemplateStore();
    const { excelData } = useDataStore();
    const { openModal, togglePanel } = useUIStore();
    const { undo, redo, canUndo, canRedo } = useHistoryStore();

    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Menu structure
    const menus: MenuItem[] = [
        {
            id: 'file',
            label: 'File',
            items: [
                {
                    label: 'New Template',
                    icon: <FaFile />,
                    shortcut: 'Ctrl+N',
                    action: () => handleNewTemplate(),
                },
                {
                    label: 'Open Template',
                    icon: <FaFolderOpen />,
                    shortcut: 'Ctrl+O',
                    action: () => openModal('openTemplate'),
                },
                { separator: true },
                {
                    label: 'Save',
                    icon: <FaSave />,
                    shortcut: 'Ctrl+S',
                    action: () => handleSave(),
                    disabled: !currentTemplate,
                },
                {
                    label: 'Save As...',
                    icon: <FaSave />,
                    shortcut: 'Ctrl+Shift+S',
                    action: () => openModal('saveTemplateAs'),
                },
                { separator: true },
                {
                    label: 'Import Template',
                    icon: <FaUpload />,
                    action: () => handleImportTemplate(),
                },
                {
                    label: 'Export Template',
                    icon: <FaDownload />,
                    action: () => handleExportTemplate(),
                    disabled: !currentTemplate,
                },
                {
                    label: 'Export as PDF',
                    icon: <FaDownload />,
                    action: () => handleExportAsPDF(),
                },
                {
                    label: 'Export as Word',
                    icon: <FaDownload />,
                    action: () => handleExportAsWord(),
                },
                { separator: true },
                {
                    label: 'Generate Documents...',
                    icon: <FaRocket />,
                    action: () => openModal('generate'),
                },
                { separator: true },
                {
                    label: 'Print',
                    icon: <FaPrint />,
                    shortcut: 'Ctrl+P',
                    action: () => handlePrint(),
                },
                { separator: true },
                {
                    label: 'Recent Templates',
                    submenu: [
                        { label: 'Certificate Template 1', action: () => { } },
                        { label: 'ID Card Template 2', action: () => { } },
                        { label: 'Marksheet Template 3', action: () => { } },
                    ],
                },
            ],
        },
        {
            id: 'edit',
            label: 'Edit',
            items: [
                {
                    label: 'Undo',
                    icon: <FaUndo />,
                    shortcut: 'Ctrl+Z',
                    action: () => undo(),
                    disabled: !canUndo,
                },
                {
                    label: 'Redo',
                    icon: <FaRedo />,
                    shortcut: 'Ctrl+Y',
                    action: () => redo(),
                    disabled: !canRedo,
                },
                { separator: true },
                {
                    label: 'Cut',
                    icon: <FaCut />,
                    shortcut: 'Ctrl+X',
                    action: () => handleCut(),
                },
                {
                    label: 'Copy',
                    icon: <FaCopy />,
                    shortcut: 'Ctrl+C',
                    action: () => handleCopy(),
                },
                {
                    label: 'Paste',
                    icon: <FaPaste />,
                    shortcut: 'Ctrl+V',
                    action: () => handlePaste(),
                },
                {
                    label: 'Delete',
                    icon: <FaTrash />,
                    shortcut: 'Delete',
                    action: () => handleDelete(),
                },
                { separator: true },
                {
                    label: 'Select All',
                    shortcut: 'Ctrl+A',
                    action: () => CanvasHelpers.selectAll(canvas),
                },
                {
                    label: 'Deselect All',
                    shortcut: 'Esc',
                    action: () => canvas?.discardActiveObject().renderAll(),
                },
                { separator: true },
                {
                    label: 'Find & Replace',
                    icon: <FaSearch />,
                    shortcut: 'Ctrl+F',
                    action: () => openModal('findReplace'),
                },
            ],
        },
        {
            id: 'view',
            label: 'View',
            items: [
                {
                    label: 'Zoom In',
                    shortcut: 'Ctrl++',
                    action: () => handleZoom(1.1),
                },
                {
                    label: 'Zoom Out',
                    shortcut: 'Ctrl+-',
                    action: () => handleZoom(0.9),
                },
                {
                    label: 'Zoom to Fit',
                    shortcut: 'Ctrl+0',
                    action: () => handleZoomToFit(),
                },
                {
                    label: 'Actual Size',
                    shortcut: 'Ctrl+1',
                    action: () => handleZoom(1, true),
                },
                { separator: true },
                {
                    label: 'Show Rulers',
                    icon: <FaRuler />,
                    shortcut: 'Ctrl+R',
                    action: () => toggleRulers(),
                    checked: true,
                },
                {
                    label: 'Show Grid',
                    icon: <FaTh />,
                    shortcut: 'Ctrl+G',
                    action: () => toggleGrid(),
                    checked: false,
                },
                {
                    label: 'Show Guides',
                    action: () => toggleGuides(),
                    checked: true,
                },
                {
                    label: 'Snap to Grid',
                    action: () => toggleSnapToGrid(),
                    checked: false,
                },
                { separator: true },
                {
                    label: 'Preview Mode',
                    icon: <FaEye />,
                    shortcut: 'Ctrl+Shift+P',
                    action: () => togglePreviewMode(),
                },
                {
                    label: 'Fullscreen',
                    icon: <FaExpand />,
                    shortcut: 'F11',
                    action: () => toggleFullscreen(),
                },
                { separator: true },
                {
                    label: 'Left Sidebar',
                    action: () => togglePanel('left'),
                    checked: true,
                },
                {
                    label: 'Right Panel',
                    action: () => togglePanel('right'),
                    checked: true,
                },
                {
                    label: 'Bottom Panel',
                    action: () => togglePanel('bottom'),
                    checked: false,
                },
            ],
        },
        {
            id: 'insert',
            label: 'Insert',
            items: [
                {
                    label: 'Text',
                    icon: <FaFont />,
                    submenu: [
                        { label: 'Text Box', action: () => insertTextBox() },
                        { label: 'Heading 1', action: () => insertHeading(1) },
                        { label: 'Heading 2', action: () => insertHeading(2) },
                        { label: 'Heading 3', action: () => insertHeading(3) },
                        { label: 'Placeholder', action: () => openModal('insertPlaceholder') },
                    ],
                },
                {
                    label: 'Shape',
                    icon: <FaShapes />,
                    submenu: [
                        { label: 'Rectangle', action: () => insertShape('rectangle') },
                        { label: 'Circle', action: () => insertShape('circle') },
                        { label: 'Triangle', action: () => insertShape('triangle') },
                        { label: 'Star', action: () => insertShape('star') },
                        { label: 'Line', action: () => insertShape('line') },
                        { label: 'More Shapes...', action: () => openModal('shapeGallery') },
                    ],
                },
                {
                    label: 'Image',
                    icon: <FaImage />,
                    submenu: [
                        { label: 'Upload Image', action: () => handleImageUpload() },
                        { label: 'From URL', action: () => openModal('imageFromURL') },
                        { label: 'Stock Images', action: () => openModal('stockImages') },
                    ],
                },
                {
                    label: 'Table',
                    icon: <FaTable />,
                    action: () => openModal('insertTable'),
                },
                {
                    label: 'QR Code',
                    icon: <FaQrcode />,
                    action: () => openModal('insertQRCode'),
                },
                {
                    label: 'Barcode',
                    action: () => openModal('insertBarcode'),
                },
                { separator: true },
                {
                    label: 'Logo',
                    action: () => insertLogo(),
                },
                {
                    label: 'Signature',
                    action: () => insertSignature(),
                },
            ],
        },
        {
            id: 'format',
            label: 'Format',
            items: [
                {
                    label: 'Align',
                    icon: <FaAlignLeft />,
                    submenu: [
                        { label: 'Align Left', action: () => alignObjects('left') },
                        { label: 'Align Center', action: () => alignObjects('center') },
                        { label: 'Align Right', action: () => alignObjects('right') },
                        { label: 'Align Top', action: () => alignObjects('top') },
                        { label: 'Align Middle', action: () => alignObjects('middle') },
                        { label: 'Align Bottom', action: () => alignObjects('bottom') },
                    ],
                },
                {
                    label: 'Distribute',
                    submenu: [
                        { label: 'Distribute Horizontally', action: () => distributeObjects('horizontal') },
                        { label: 'Distribute Vertically', action: () => distributeObjects('vertical') },
                    ],
                },
                { separator: true },
                {
                    label: 'Rotate',
                    submenu: [
                        { label: 'Rotate 90° Clockwise', action: () => rotateObjects(90) },
                        { label: 'Rotate 90° Counter-Clockwise', action: () => rotateObjects(-90) },
                        { label: 'Rotate 180°', action: () => rotateObjects(180) },
                        { label: 'Flip Horizontal', action: () => flipObjects('horizontal') },
                        { label: 'Flip Vertical', action: () => flipObjects('vertical') },
                    ],
                },
                { separator: true },
                {
                    label: 'Group',
                    shortcut: 'Ctrl+G',
                    action: () => groupObjects(),
                },
                {
                    label: 'Ungroup',
                    shortcut: 'Ctrl+Shift+G',
                    action: () => ungroupObjects(),
                },
                { separator: true },
                {
                    label: 'Lock',
                    action: () => lockObjects(true),
                },
                {
                    label: 'Unlock',
                    action: () => lockObjects(false),
                },
            ],
        },
        {
            id: 'arrange',
            label: 'Arrange',
            items: [
                {
                    label: 'Bring to Front',
                    icon: <FaLayerGroup />,
                    shortcut: 'Ctrl+Shift+]',
                    action: () => bringToFront(),
                },
                {
                    label: 'Bring Forward',
                    shortcut: 'Ctrl+]',
                    action: () => bringForward(),
                },
                {
                    label: 'Send Backward',
                    shortcut: 'Ctrl+[',
                    action: () => sendBackward(),
                },
                {
                    label: 'Send to Back',
                    shortcut: 'Ctrl+Shift+[',
                    action: () => sendToBack(),
                },
                { separator: true },
                {
                    label: 'Show Layers Panel',
                    action: () => togglePanel('bottom'),
                },
            ],
        },
        {
            id: 'data',
            label: 'Data',
            items: [
                {
                    label: 'Load Excel File',
                    icon: <FaUpload />,
                    action: () => handleLoadExcel(),
                },
                {
                    label: 'View Data',
                    icon: <FaEye />,
                    action: () => openModal('dataPreview'),
                    disabled: !excelData,
                },
                {
                    label: 'Manage Mappings',
                    icon: <FaLink />,
                    action: () => openModal('dataMapping'),
                    disabled: !excelData,
                },
                { separator: true },
                {
                    label: 'Generate Documents',
                    icon: <FaRocket />,
                    shortcut: 'Ctrl+Shift+G',
                    action: () => openModal('generate'),
                    disabled: !excelData || !currentTemplate,
                },
            ],
        },
        {
            id: 'help',
            label: 'Help',
            items: [
                {
                    label: 'Documentation',
                    icon: <FaBook />,
                    action: () => window.open('https://docs.example.com', '_blank'),
                },
                {
                    label: 'Keyboard Shortcuts',
                    icon: <FaKeyboard />,
                    shortcut: 'Ctrl+/',
                    action: () => openModal('keyboardShortcuts'),
                },
                {
                    label: 'Tutorial',
                    action: () => openModal('tutorial'),
                },
                { separator: true },
                {
                    label: 'Report Issue',
                    action: () => window.open('https://github.com/example/issues', '_blank'),
                },
                {
                    label: 'About',
                    icon: <FaQuestion />,
                    action: () => openModal('about'),
                },
            ],
        },
    ];

    // Menu action handlers
    const handleNewTemplate = () => {
        if (currentTemplate && !(currentTemplate as any).isSaved) {
            if (confirm('You have unsaved changes. Do you want to continue?')) {
                newTemplate();
            }
        } else {
            newTemplate();
        }
    };

    const handleSave = async () => {
        if (currentTemplate?.id) {
            const data = CanvasHelpers.getCanvasData(canvas);
            const updatedTemplate = { ...currentTemplate, data };
            await saveTemplate(updatedTemplate);
        } else {
            // For Save As, we probably should pass the data to the modal or store it temporarily?
            // Or the Modal will grab it?
            // Existing logic just opened modal. The modal likely needs to grab fresh data.
            // If the modal grabs from currentTemplate, then we SHOULD update currentTemplate first?
            // But setCurrentTemplate invalidates React state.

            // Proper way: "Save As" modal should use CanvasHelpers.getCanvasData() when it actually saves.
            // I should verify where that modal is.

            // For now, let's fix the direct "Save" which is the most critical path for "Saving template"
            openModal('saveTemplateAs');
        }
    };

    const handleExportTemplate = () => {
        if (!currentTemplate) return;
        exportTemplate(currentTemplate.id);
    };

    const handleExportAsPDF = async () => {
        if (!canvas) return;
        const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const filename = currentTemplate?.name || 'Template';
        const blob = await generatePDF(dataUrl, width, height, filename);
        downloadFile(blob, `${filename}.pdf`);
    };

    const handleExportAsWord = async () => {
        if (!canvas) return;
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const filename = currentTemplate?.name || 'Template';
        const blob = await generateWord(canvas, width, height, filename);
        downloadFile(blob, `${filename}.docx`);
    };

    const handleImportTemplate = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const templateData = JSON.parse(event.target?.result as string);
                        await importTemplate(templateData);
                    } catch (error) {
                        alert('Failed to import template');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handlePrint = () => {
        if (!canvas) return;
        const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<img src="${dataUrl}" onload="window.print();window.close()" />`);
        }
    };

    const handleCut = () => {
        handleCopy();
        handleDelete();
    };

    const handleCopy = () => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((cloned: fabric.Object) => {
                (window as any)._clipboard = cloned;
            });
        }
    };

    const handlePaste = () => {
        if (!canvas) return;
        const clipboard = (window as any)._clipboard;
        if (clipboard) {
            clipboard.clone((clonedObj: fabric.Object) => {
                canvas.discardActiveObject();
                clonedObj.set({
                    left: (clonedObj.left || 0) + 10,
                    top: (clonedObj.top || 0) + 10,
                    evented: true,
                });
                if (clonedObj.type === 'activeSelection') {
                    clonedObj.canvas = canvas;
                    (clonedObj as fabric.ActiveSelection).forEachObject((obj) => {
                        canvas.add(obj);
                    });
                    clonedObj.setCoords();
                } else {
                    canvas.add(clonedObj);
                }
                canvas.setActiveObject(clonedObj);
                canvas.requestRenderAll();
            });
        }
    };

    const handleDelete = () => {
        if (!canvas) return;
        CanvasHelpers.deleteSelected(canvas);
    };

    const handleZoom = (factor: number, absolute = false) => {
        if (!canvas) return;
        const zoom = absolute ? factor : canvas.getZoom() * factor;
        canvas.setZoom(Math.min(Math.max(zoom, 0.25), 4));
        canvas.renderAll();
    };

    const handleZoomToFit = () => {
        if (!canvas) return;
        // Implementation for zoom to fit
    };

    const toggleRulers = () => {
        // Toggle rulers visibility
    };

    const toggleGrid = () => {
        // Toggle grid visibility
    };

    const toggleGuides = () => {
        // Toggle guides visibility
    };

    const toggleSnapToGrid = () => {
        // Toggle snap to grid
    };

    const togglePreviewMode = () => {
        // Toggle preview mode
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const insertTextBox = () => {
        if (!canvas) return;
        const textbox = new fabric.Textbox('Enter text here', {
            left: 100,
            top: 100,
            fontSize: 16,
            width: 200,
        });
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.renderAll();
    };

    const insertHeading = (level: number) => {
        if (!canvas) return;
        const fontSize = level === 1 ? 48 : level === 2 ? 36 : 24;
        const textbox = new fabric.Textbox(`Heading ${level}`, {
            left: 100,
            top: 100,
            fontSize,
            fontWeight: 'bold',
            width: 400,
        });
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.renderAll();
    };

    const insertShape = (shapeType: string) => {
        // Implementation from ElementFactory
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fabric.Image.fromURL(event.target?.result as string, (img) => {
                        img.set({ left: 100, top: 100 });
                        canvas?.add(img);

                        // Auto-scale to fit canvas
                        if (canvas) {
                            ElementFactory.scaleImageToFit(img, canvas.width || 800, canvas.height || 600);
                            img.center();
                            img.setCoords();
                        }

                        canvas?.setActiveObject(img);
                        canvas?.renderAll();
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const insertLogo = () => {
        // Open uploads tab with logos filter
    };

    const insertSignature = () => {
        // Open uploads tab with signatures filter
    };

    const alignObjects = (alignment: string) => {
        if (!canvas) return;
        CanvasHelpers.alignObjects(canvas, alignment);
    };

    const distributeObjects = (direction: 'horizontal' | 'vertical') => {
        if (!canvas) return;
        CanvasHelpers.distributeObjects(canvas, direction);
    };

    const rotateObjects = (angle: number) => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            // fabric.Object types might be incomplete in some definitions without casting or property access checks
            const obj = activeObject as fabric.Object;
            obj.rotate((obj.angle || 0) + angle);
            canvas.renderAll();
        }
    };

    const flipObjects = (direction: 'horizontal' | 'vertical') => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            if (direction === 'horizontal') {
                activeObject.set({ flipX: !activeObject.flipX });
            } else {
                activeObject.set({ flipY: !activeObject.flipY });
            }
            canvas.renderAll();
        }
    };

    const groupObjects = () => {
        if (!canvas) return;
        CanvasHelpers.groupObjects(canvas);
    };

    const ungroupObjects = () => {
        if (!canvas) return;
        CanvasHelpers.ungroupObjects(canvas);
    };

    const lockObjects = (lock: boolean) => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.set({
                lockMovementX: lock,
                lockMovementY: lock,
                lockRotation: lock,
                lockScalingX: lock,
                lockScalingY: lock,
                selectable: !lock,
                evented: !lock,
            });
            canvas.renderAll();
        }
    };

    const bringToFront = () => {
        if (!canvas) return;
        CanvasHelpers.bringToFront(canvas);
    };

    const bringForward = () => {
        if (!canvas) return;
        CanvasHelpers.bringForward(canvas);
    };

    const sendBackward = () => {
        if (!canvas) return;
        CanvasHelpers.sendBackward(canvas);
    };

    const sendToBack = () => {
        if (!canvas) return;
        CanvasHelpers.sendToBack(canvas);
    };

    const handleLoadExcel = () => {
        // Trigger Excel file upload
        openModal('loadExcel');
    };

    return (
        <div className="top-menu-bar">
            {menus.map(menu => (
                <div
                    key={menu.id}
                    className={`menu-item ${openMenu === menu.id ? 'active' : ''}`}
                    onMouseEnter={() => openMenu && setOpenMenu(menu.id || null)}
                >
                    <button
                        className="menu-trigger"
                        onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id || null)}
                    >
                        {menu.label}
                    </button>

                    {openMenu === menu.id && (
                        <>
                            <div
                                className="menu-backdrop"
                                onClick={() => setOpenMenu(null)}
                            />
                            <div className="menu-dropdown">
                                {menu.items?.map((item, index) => (
                                    <React.Fragment key={index}>
                                        {item.separator ? (
                                            <div className="menu-separator" />
                                        ) : item.submenu ? (
                                            <div className="menu-item-submenu">
                                                <button className="menu-dropdown-item">
                                                    {item.icon && <span className="item-icon">{item.icon}</span>}
                                                    <span className="item-label">{item.label}</span>
                                                    <span className="submenu-arrow">▶</span>
                                                </button>
                                                <div className="submenu-dropdown">
                                                    {item.submenu?.map((subItem, subIndex) => (
                                                        <button
                                                            key={subIndex}
                                                            className="menu-dropdown-item"
                                                            onClick={() => {
                                                                subItem.action?.();
                                                                setOpenMenu(null);
                                                            }}
                                                        >
                                                            <span className="item-label">{subItem.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                className={`menu-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                                                onClick={() => {
                                                    if (!item.disabled) {
                                                        item.action?.();
                                                        setOpenMenu(null);
                                                    }
                                                }}
                                                disabled={item.disabled}
                                            >
                                                {item.icon && <span className="item-icon">{item.icon}</span>}
                                                <span className="item-label">{item.label}</span>
                                                {item.shortcut && (
                                                    <span className="item-shortcut">{item.shortcut}</span>
                                                )}
                                                {item.checked !== undefined && (
                                                    <span className="item-check">
                                                        {item.checked ? '✓' : ''}
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* App Settings Icon */}
            <div className="menu-settings">
                <button
                    className="settings-button"
                    onClick={() => openModal('settings')}
                    title="Settings"
                >
                    <FaCog />
                </button>
            </div>
        </div>
    );
};
