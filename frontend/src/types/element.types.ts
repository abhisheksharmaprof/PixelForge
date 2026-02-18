export type ElementType =
    | 'text'
    | 'placeholder'
    | 'shape'
    | 'image'
    | 'table'
    | 'qrcode'
    | 'barcode'
    | 'group';

export interface BaseElement {
    id: string;
    type: ElementType;
    name: string;

    // Position
    left: number;
    top: number;
    width: number;
    height: number;

    // Transform
    angle: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    flipX: boolean;
    flipY: boolean;

    // Appearance
    opacity: number;
    visible: boolean;
    locked: boolean;

    // Layer
    zIndex: number;

    // Effects
    shadow: {
        enabled: boolean;
        color: string;
        blur: number;
        offsetX: number;
        offsetY: number;
    };

    // Blend
    blendMode: string;

    // Metadata
    createdAt: Date;
    modifiedAt: Date;
}

export interface TextElement extends BaseElement {
    type: 'text';
    content: string;

    // Font
    fontFamily: string;
    fontSize: number;
    fontWeight: number | string;
    fontStyle: 'normal' | 'italic' | 'oblique';

    // Text Style
    fill: string;
    stroke: string;
    strokeWidth: number;
    textDecoration: string;
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

    // Paragraph
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;

    // Effects
    textShadow: string;
    backgroundColor: string;

    // Advanced
    curved: boolean;
    curveAmount: number;
    onPath: boolean;
    pathId: string | null;
}

export interface PlaceholderElement extends Omit<TextElement, 'type'> {
    type: 'placeholder';
    placeholderName: string;
    columnMapping: string | null;
    format: string;
    fallbackValue: string;
    conditional: {
        enabled: boolean;
        conditions: Array<{
            column: string;
            operator: string;
            value: any;
            action: 'show' | 'hide' | 'changeColor' | 'changeText';
            actionValue: any;
        }>;
    };
}

export interface ShapeElement extends BaseElement {
    type: 'shape';
    shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line';

    // Fill
    fill: string;
    fillType: 'solid' | 'gradient' | 'pattern' | 'image';
    gradient: {
        type: 'linear' | 'radial';
        angle: number;
        stops: Array<{ offset: number; color: string }>;
    };

    // Stroke
    stroke: string;
    strokeWidth: number;
    strokeDashArray: number[];
    strokeLineCap: 'butt' | 'round' | 'square';
    strokeLineJoin: 'miter' | 'round' | 'bevel';

    // Shape-specific
    rx: number; // Rectangle corner radius
    ry: number; // Rectangle corner radius
    points: number; // Star/Polygon points
    innerRadius: number; // Star inner radius
}

export interface ImageElement extends BaseElement {
    type: 'image';
    src: string;

    // Adjustments
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    blur: number;
    grayscale: number;
    sepia: number;

    // Filters
    filterPreset: string | null;

    // Crop
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;

    // Mask
    maskShape: string | null;

    // Border
    borderWidth: number;
    borderColor: string;
    borderRadius: number;

    // Dynamic
    isDynamic: boolean;
    dynamicColumnMapping: string | null;
    fallbackImage: string;
}

export interface TableElement extends BaseElement {
    type: 'table';
    rows: number;
    columns: number;

    // Cell Data
    cells: Array<Array<{
        content: string;
        isPlaceholder: boolean;
        placeholderName: string | null;

        // Cell Style
        backgroundColor: string;
        textColor: string;
        fontSize: number;
        fontWeight: string;
        textAlign: string;
        verticalAlign: 'top' | 'middle' | 'bottom';

        // Cell Border
        borderTop: { width: number; color: string; style: string };
        borderRight: { width: number; color: string; style: string };
        borderBottom: { width: number; color: string; style: string };
        borderLeft: { width: number; color: string; style: string };

        // Merge
        colSpan: number;
        rowSpan: number;
        hidden: boolean;
    }>>;

    // Table Style
    cellPadding: number;
    cellSpacing: number;
    borderCollapse: boolean;
    borderColor: string;
    borderWidth: number;

    // Header & Alternate Rows
    hasHeaderRow: boolean;
    headerBackgroundColor: string;
    headerTextColor: string;
    alternateRows: boolean;
    alternateRowBackgroundColor: string;

    // Column Widths
    columnWidths: number[];
    rowHeights: number[];

    // Data Binding
    dataSourceId?: string;
    columnMapping?: Record<number, string>; // columnIndex -> fieldName
    visibleRowCount?: number;
}

export interface QRCodeElement extends BaseElement {
    type: 'qrcode';
    data: string;
    isPlaceholder: boolean;
    placeholderName: string | null;

    // QR Settings
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    margin: number;

    // Style
    foregroundColor: string;
    backgroundColor: string;
}

export interface BarcodeElement extends BaseElement {
    type: 'barcode';
    data: string;
    isPlaceholder: boolean;
    placeholderName: string | null;

    // Barcode Settings
    format: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39';
    displayValue: boolean;

    // Style
    lineColor: string;
    backgroundColor: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
    textPosition: 'top' | 'bottom';
    textMargin: number;
}
