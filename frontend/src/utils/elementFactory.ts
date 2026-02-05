import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import {
    BaseElement,
    TextElement,
    PlaceholderElement,
    ShapeElement,
    ImageElement,
    TableElement,
    QRCodeElement,
    BarcodeElement
} from '../types/element.types';

export class ElementFactory {
    // Create Text Element
    static createTextElement(options?: Partial<TextElement>): fabric.Textbox {
        const id = uuidv4();

        // Cast options to any to avoid strict type checks with Fabric types
        const textOptions = options as any;

        const textbox = new fabric.Textbox('Enter text here', {
            left: options?.left || 100,
            top: options?.top || 100,
            width: options?.width || 200,
            fontSize: options?.fontSize || 16,
            fontFamily: options?.fontFamily || 'Arial',
            fill: options?.fill || '#000000',
            textAlign: options?.textAlign || 'left',
            ...textOptions,
        });

        // Add custom properties
        (textbox as any).elementId = id;
        (textbox as any).elementType = 'text';
        (textbox as any).createdAt = new Date();
        (textbox as any).modifiedAt = new Date();

        return textbox;
    }

    // Create Placeholder Element
    static createPlaceholderElement(
        placeholderName: string,
        options?: Partial<PlaceholderElement>
    ): fabric.Textbox {
        const id = uuidv4();
        const placeholderOptions = options as any; // Cast to any

        const placeholder = new fabric.Textbox(`{{${placeholderName}}}`, {
            left: options?.left || 100,
            top: options?.top || 100,
            width: options?.width || 200,
            fontSize: options?.fontSize || 16,
            fontFamily: options?.fontFamily || 'Arial',
            fill: options?.fill || '#6B46C1',
            backgroundColor: 'rgba(107, 70, 193, 0.1)',
            borderColor: '#6B46C1',
            ...placeholderOptions,
        });

        // Add custom properties
        (placeholder as any).elementId = id;
        (placeholder as any).elementType = 'placeholder';
        (placeholder as any).placeholderName = placeholderName;
        (placeholder as any).columnMapping = options?.columnMapping || null;
        (placeholder as any).format = options?.format || 'none';
        (placeholder as any).fallbackValue = options?.fallbackValue || '';
        (placeholder as any).createdAt = new Date();
        (placeholder as any).modifiedAt = new Date();

        return placeholder;
    }

    // Create Rectangle
    static createRectangle(options?: Partial<ShapeElement>): fabric.Rect {
        const id = uuidv4();
        const shapeOptions = options as any; // Cast to any

        const rect = new fabric.Rect({
            left: options?.left || 100,
            top: options?.top || 100,
            width: options?.width || 200,
            height: options?.height || 100,
            fill: options?.fill || '#4A90E2',
            stroke: options?.stroke || '#000000',
            strokeWidth: options?.strokeWidth || 0,
            rx: options?.rx || 0,
            ry: options?.ry || 0,
            ...shapeOptions,
        });

        (rect as any).elementId = id;
        (rect as any).elementType = 'shape';
        (rect as any).shapeType = 'rectangle';
        (rect as any).createdAt = new Date();

        return rect;
    }

    // Create Circle
    static createCircle(options?: Partial<ShapeElement>): fabric.Circle {
        const id = uuidv4();
        const shapeOptions = options as any;

        const circle = new fabric.Circle({
            left: options?.left || 100,
            top: options?.top || 100,
            radius: options?.width ? options.width / 2 : 50,
            fill: options?.fill || '#4A90E2',
            stroke: options?.stroke || '#000000',
            strokeWidth: options?.strokeWidth || 0,
            ...shapeOptions,
        });

        (circle as any).elementId = id;
        (circle as any).elementType = 'shape';
        (circle as any).shapeType = 'circle';
        (circle as any).createdAt = new Date();

        return circle;
    }

    // Create Triangle
    static createTriangle(options?: Partial<ShapeElement>): fabric.Triangle {
        const id = uuidv4();
        const shapeOptions = options as any;

        const triangle = new fabric.Triangle({
            left: options?.left || 100,
            top: options?.top || 100,
            width: options?.width || 100,
            height: options?.height || 100,
            fill: options?.fill || '#4A90E2',
            stroke: options?.stroke || '#000000',
            strokeWidth: options?.strokeWidth || 0,
            ...shapeOptions,
        });

        (triangle as any).elementId = id;
        (triangle as any).elementType = 'shape';
        (triangle as any).shapeType = 'triangle';
        (triangle as any).createdAt = new Date();

        return triangle;
    }

    // Create Polygon
    static createPolygon(
        sides: number = 6,
        options?: Partial<ShapeElement>
    ): fabric.Polygon {
        const id = uuidv4();
        const radius = options?.width ? options.width / 2 : 50;
        const shapeOptions = options as any;

        // Calculate polygon points
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            points.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
            });
        }

        const polygon = new fabric.Polygon(points, {
            left: options?.left || 100,
            top: options?.top || 100,
            fill: options?.fill || '#4A90E2',
            stroke: options?.stroke || '#000000',
            strokeWidth: options?.strokeWidth || 0,
            ...shapeOptions,
        });

        (polygon as any).elementId = id;
        (polygon as any).elementType = 'shape';
        (polygon as any).shapeType = 'polygon';
        (polygon as any).points = sides;
        (polygon as any).createdAt = new Date();

        return polygon;
    }

    // Create Star
    static createStar(
        points: number = 5,
        innerRadius: number = 0.5,
        options?: Partial<ShapeElement>
    ): fabric.Polygon {
        const id = uuidv4();
        const outerRadius = options?.width ? options.width / 2 : 50;
        const innerRad = outerRadius * innerRadius;
        const shapeOptions = options as any;

        // Calculate star points
        const starPoints = [];
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRad;
            starPoints.push({
                x: radius * Math.cos(angle - Math.PI / 2),
                y: radius * Math.sin(angle - Math.PI / 2),
            });
        }

        const star = new fabric.Polygon(starPoints, {
            left: options?.left || 100,
            top: options?.top || 100,
            fill: options?.fill || '#4A90E2',
            stroke: options?.stroke || '#000000',
            strokeWidth: options?.strokeWidth || 0,
            ...shapeOptions,
        });

        (star as any).elementId = id;
        (star as any).elementType = 'shape';
        (star as any).shapeType = 'star';
        (star as any).points = points;
        (star as any).innerRadius = innerRadius;
        (star as any).createdAt = new Date();

        return star;
    }

    // Create Line
    static createLine(options?: Partial<ShapeElement>): fabric.Line {
        const id = uuidv4();
        const shapeOptions = options as any;

        const line = new fabric.Line(
            [
                options?.left || 100,
                options?.top || 100,
                (options?.left || 100) + (options?.width || 200),
                (options?.top || 100) + (options?.height || 0),
            ],
            {
                stroke: options?.stroke || '#000000',
                strokeWidth: options?.strokeWidth || 2,
                ...shapeOptions,
            }
        );

        (line as any).elementId = id;
        (line as any).elementType = 'shape';
        (line as any).shapeType = 'line';
        (line as any).createdAt = new Date();

        return line;
    }

    // Create Image
    static createImage(
        src: string,
        options?: Partial<ImageElement>
    ): Promise<fabric.Image> {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(src, (img) => {
                if (!img) {
                    reject(new Error('Failed to load image'));
                    return;
                }

                const id = uuidv4();
                const imgOptions = options as any;

                img.set({
                    left: options?.left || 100,
                    top: options?.top || 100,
                    ...imgOptions,
                });

                (img as any).elementId = id;
                (img as any).elementType = 'image';
                (img as any).src = src;
                (img as any).createdAt = new Date();

                resolve(img);
            }, {
                crossOrigin: 'anonymous',
            });
        });
    }

    // Create Table (as Group of Rects and Textboxes)
    static createTable(
        rows: number = 3,
        columns: number = 3,
        options?: Partial<TableElement>
    ): fabric.Group {
        const id = uuidv4();
        const cellWidth = 100;
        const cellHeight = 40;
        const tableOptions = options as any;

        const elements: fabric.Object[] = [];

        // Create cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                // Cell background
                const cell = new fabric.Rect({
                    left: col * cellWidth,
                    top: row * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                    fill: row === 0 ? '#f0f0f0' : '#ffffff',
                    stroke: '#cccccc',
                    strokeWidth: 1,
                });

                // Cell text
                const text = new fabric.Textbox('', {
                    left: col * cellWidth + 5,
                    top: row * cellHeight + 10,
                    width: cellWidth - 10,
                    fontSize: 14,
                    fill: '#000000',
                });

                elements.push(cell, text);
            }
        }

        const table = new fabric.Group(elements, {
            left: options?.left || 100,
            top: options?.top || 100,
            ...tableOptions,
        });

        (table as any).elementId = id;
        (table as any).elementType = 'table';
        (table as any).rows = rows;
        (table as any).columns = columns;
        (table as any).createdAt = new Date();

        return table;
    }

    // Create QR Code
    static async createQRCode(
        data: string,
        options?: Partial<QRCodeElement>
    ): Promise<fabric.Image> {
        const QRCode = (await import('qrcode')).default;
        const qrOptions = options as any;

        const id = uuidv4();
        const qrDataURL = await QRCode.toDataURL(data, {
            errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
            margin: options?.margin || 1,
            width: options?.width || 200,
            color: {
                dark: options?.foregroundColor || '#000000',
                light: options?.backgroundColor || '#FFFFFF',
            },
        });

        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(qrDataURL, (img) => {
                if (!img) {
                    reject(new Error('Failed to create QR code'));
                    return;
                }

                img.set({
                    left: options?.left || 100,
                    top: options?.top || 100,
                    ...qrOptions,
                });

                (img as any).elementId = id;
                (img as any).elementType = 'qrcode';
                (img as any).qrData = data;
                (img as any).createdAt = new Date();

                resolve(img);
            });
        });
    }

    // Create Barcode
    static async createBarcode(
        data: string,
        options?: Partial<BarcodeElement>
    ): Promise<fabric.Image> {
        const JsBarcode = (await import('jsbarcode')).default;
        const barcodeOptions = options as any;

        const id = uuidv4();
        const canvas = document.createElement('canvas');

        JsBarcode(canvas, data, {
            format: options?.format || 'CODE128',
            width: 2,
            height: options?.height || 100,
            displayValue: options?.displayValue !== false,
            fontSize: options?.fontSize || 14,
            textAlign: options?.textAlign || 'center',
            textPosition: options?.textPosition || 'bottom',
            textMargin: options?.textMargin || 2,
            lineColor: options?.lineColor || '#000000',
            background: options?.backgroundColor || '#FFFFFF',
        });

        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(canvas.toDataURL(), (img) => {
                if (!img) {
                    reject(new Error('Failed to create barcode'));
                    return;
                }

                img.set({
                    left: options?.left || 100,
                    top: options?.top || 100,
                    ...barcodeOptions,
                });

                (img as any).elementId = id;
                (img as any).elementType = 'barcode';
                (img as any).barcodeData = data;
                (img as any).barcodeFormat = options?.format || 'CODE128';
                (img as any).createdAt = new Date();

                resolve(img);
            });
        });
    }
    // Helper to scale image to fit within dimensions
    static scaleImageToFit(img: fabric.Object, maxWidth: number, maxHeight: number, margin: number = 0.8): void {
        if (!img.width || !img.height) return;

        const scaleX = maxWidth / img.width;
        const scaleY = maxHeight / img.height;
        const scale = Math.min(scaleX, scaleY);

        if (scale < 1) {
            img.scale(scale * margin);
        }
    }
}
