import { fabric } from 'fabric';
import { TableElement } from '../../../types/element.types';
import { useMailMergeStore } from '../../../store/mailMergeStore';

export interface TableData extends Partial<TableElement> {
    rows: number;
    columns: number;
    rowHeights: number[];
    columnWidths: number[];
    cells: TableElement['cells'];
    dataSourceId?: string;
    columnMapping?: Record<number, string>;
    visibleRowCount?: number;
}

export class FabricTable extends fabric.Group {
    public type = 'table';
    public elementType = 'table';
    public rows: number;
    public columns: number;
    public rowHeights: number[];
    public columnWidths: number[];
    public cells: TableElement['cells'];
    public tableBorderColor: string = '#ccc';
    public tableBorderWidth: number = 1;
    public cellPadding: number = 5;

    // Data Binding
    public dataSourceId?: string;
    public columnMapping: Record<number, string> = {};
    public visibleRowCount: number = 5;

    // Header & Alternate Rows
    public hasHeaderRow: boolean = false;
    public headerBackgroundColor: string = '#f0f0f0';
    public headerTextColor: string = '#000000';
    public alternateRows: boolean = false;
    public alternateRowBackgroundColor: string = '#f9f9f9';

    // State
    public activeCell: { row: number, col: number } | null = null;
    public selectionRange: { startRow: number, startCol: number, endRow: number, endCol: number } | null = null;

    // Visual configuration
    private _gridLines: fabric.Line[] = [];
    private _cellBackgrounds: fabric.Rect[] = [];
    private _cellText: fabric.Textbox[] = [];
    private _cellBorders: fabric.Line[] = [];
    private _editingCell: { row: number, col: number } | null = null;

    // Flag to prevent selection events during internal updates
    public _isUpdating: boolean = false;

    constructor(options: TableData, fabricOptions?: fabric.IGroupOptions) {
        super([], fabricOptions);

        this.rows = options.rows || 3;
        this.columns = options.columns || 3;
        this.rowHeights = options.rowHeights || Array(this.rows).fill(40);
        this.columnWidths = options.columnWidths || Array(this.columns).fill(100);
        this.cells = options.cells || this._createDefaultCells();
        this.tableBorderColor = options.borderColor || '#ccc';
        this.tableBorderWidth = (options as any).borderWidth || 1;
        this.cellPadding = (options as any).cellPadding || 5;

        this.dataSourceId = options.dataSourceId;
        this.columnMapping = options.columnMapping || {};
        this.visibleRowCount = options.visibleRowCount || 5;

        this.hasHeaderRow = options.hasHeaderRow || false;
        this.headerBackgroundColor = options.headerBackgroundColor || '#f0f0f0';
        this.headerTextColor = options.headerTextColor || '#000000';
        this.alternateRows = options.alternateRows || false;
        this.alternateRowBackgroundColor = options.alternateRowBackgroundColor || '#f9f9f9';

        this.set({
            type: 'table',
            // @ts-ignore
            elementType: 'table',
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockUniScaling: true,
            subTargetCheck: false
        } as any);

        // Initial data fetch if bound
        if (this.dataSourceId) {
            this.refreshData();
        } else {
            this._initTable();
        }
    }

    private _createDefaultCells(): TableElement['cells'] {
        const cells: TableElement['cells'] = [];
        for (let r = 0; r < this.rows; r++) {
            const row: TableElement['cells'][0] = [];
            for (let c = 0; c < this.columns; c++) {
                row.push(this._createCell());
            }
            cells.push(row);
        }
        return cells;
    }

    private _createCell() {
        return {
            content: '',
            isPlaceholder: false,
            placeholderName: null,
            backgroundColor: 'transparent',
            textColor: '#000000',
            fontSize: 16,
            fontWeight: 'normal',
            textAlign: 'left',
            verticalAlign: 'top' as const,
            borderTop: { width: 1, color: '#cccccc', style: 'solid' },
            borderRight: { width: 1, color: '#cccccc', style: 'solid' },
            borderBottom: { width: 1, color: '#cccccc', style: 'solid' },
            borderLeft: { width: 1, color: '#cccccc', style: 'solid' },
            colSpan: 1,
            rowSpan: 1,
            hidden: false
        };
    }

    public updateLayout() {
        console.log('[DEBUG FabricTable] updateLayout called. dataSourceId:', this.dataSourceId);
        if (this.dataSourceId) {
            this.refreshData();
        } else {
            this._initTable();
        }
    }

    public addRow(index: number = -1) {
        if (index === -1) index = this.rows;

        const newRow: TableElement['cells'][0] = [];
        for (let c = 0; c < this.columns; c++) {
            newRow.push(this._createCell());
        }

        this.cells.splice(index, 0, newRow);
        this.rowHeights.splice(index, 0, 40);
        this.rows++;
        this._initTable();
    }

    public addColumn(index: number = -1) {
        if (index === -1) index = this.columns;

        for (let r = 0; r < this.rows; r++) {
            this.cells[r].splice(index, 0, this._createCell());
        }

        this.columnWidths.splice(index, 0, 100);
        this.columns++;
        this._initTable();
    }

    public deleteRow(index: number) {
        if (index < 0 || index >= this.rows || this.rows <= 1) return;

        this.cells.splice(index, 1);
        this.rowHeights.splice(index, 1);
        this.rows--;
        this._initTable();
    }

    public deleteColumn(index: number) {
        if (index < 0 || index >= this.columns || this.columns <= 1) return;

        for (let r = 0; r < this.rows; r++) {
            this.cells[r].splice(index, 1);
        }

        this.columnWidths.splice(index, 1);
        this.columns--;
        this._initTable();
    }

    public distributeRows() {
        const totalHeight = this.rowHeights.reduce((a, b) => a + b, 0);
        const avgHeight = totalHeight / this.rows;
        this.rowHeights = Array(this.rows).fill(avgHeight);
        this._initTable();
    }

    public distributeColumns() {
        const totalWidth = this.columnWidths.reduce((a, b) => a + b, 0);
        const avgWidth = totalWidth / this.columns;
        this.columnWidths = Array(this.columns).fill(avgWidth);
        this._initTable();
    }

    private _initTable() {
        console.log('[DEBUG FabricTable] _initTable called. Padding:', this.cellPadding, 'Rows:', this.rows);
        this.objectCaching = false; // FORCE NO CACHE
        this._isUpdating = true;

        // Reset tracking arrays
        this._cellBackgrounds = [];
        this._cellBorders = [];
        this._cellText = [];
        this._gridLines = [];

        // Clear all children from the group
        const objects = this.getObjects().slice(); // copy array
        for (const obj of objects) {
            this.remove(obj);
        }

        // Re-render all visual elements
        this._renderBackgrounds();
        this._renderContent();
        this._renderBorders();
        this._renderSelection();

        // Recalculate group bounds
        this.addWithUpdate();

        // Ensure type stays 'table' after addWithUpdate
        (this as any).type = 'table';
        (this as any).elementType = 'table';

        console.log('[DEBUG FabricTable] _initTable finished. Objects count:', this.getObjects().length);
        if (this.getObjects().length > 0) {
            const firstObj = this.getObjects()[0] as any;
            console.log('[DEBUG FabricTable] First object type:', firstObj.type, 'fill:', firstObj.fill);
            if (firstObj.type === 'rect') console.log('Rect dimensions:', firstObj.width, firstObj.height);
        }
        this.setCoords();
        this._isUpdating = false;
    }

    private _renderBackgrounds() {
        console.log('[DEBUG FabricTable] _renderBackgrounds running');
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                const cell = this.cells[r][c];
                if (cell.hidden) continue;

                const bounds = this.getCellBounds(r, c);
                if (!bounds) continue;

                let bgColor = cell.backgroundColor;
                if (this.hasHeaderRow && r === 0) {
                    bgColor = this.headerBackgroundColor;
                } else if (this.alternateRows && r % 2 === 1) {
                    bgColor = this.alternateRowBackgroundColor;
                }

                if (bgColor && bgColor !== 'transparent') {
                    const bgRect = new fabric.Rect({
                        left: bounds.left,
                        top: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                        fill: bgColor,
                        selectable: false
                    });
                    this.add(bgRect);
                    this._cellBackgrounds.push(bgRect);
                }
            }
        }
    }

    private _renderBorders() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                const cell = this.cells[r][c];
                if (cell.hidden) continue;

                const bounds = this.getCellBounds(r, c);
                if (!bounds) continue;

                if (cell.borderTop.width > 0) {
                    const isBound = this.columnMapping[c] !== undefined;
                    this.add(new fabric.Line([bounds.left, bounds.top, bounds.left + bounds.width, bounds.top], {
                        stroke: isBound ? '#8b5cf6' : cell.borderTop.color,
                        strokeWidth: isBound ? Math.max(2, cell.borderTop.width) : cell.borderTop.width,
                        selectable: false
                    }));
                }
                if (cell.borderBottom.width > 0) {
                    this.add(new fabric.Line([bounds.left, bounds.top + bounds.height, bounds.left + bounds.width, bounds.top + bounds.height], {
                        stroke: cell.borderBottom.color,
                        strokeWidth: cell.borderBottom.width,
                        selectable: false
                    }));
                }
                if (cell.borderLeft.width > 0) {
                    this.add(new fabric.Line([bounds.left, bounds.top, bounds.left, bounds.top + bounds.height], {
                        stroke: cell.borderLeft.color,
                        strokeWidth: cell.borderLeft.width,
                        selectable: false
                    }));
                }
                if (cell.borderRight.width > 0) {
                    this.add(new fabric.Line([bounds.left + bounds.width, bounds.top, bounds.left + bounds.width, bounds.top + bounds.height], {
                        stroke: cell.borderRight.color,
                        strokeWidth: cell.borderRight.width,
                        selectable: false
                    }));
                }
            }
        }
    }

    private _renderContent() {
        console.log('[DEBUG FabricTable] _renderContent running. Padding:', this.cellPadding);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                const cell = this.cells[r][c];
                if (cell.hidden) continue;

                if (this._editingCell && this._editingCell.row === r && this._editingCell.col === c) {
                    continue;
                }

                if (cell.content) {
                    const bounds = this.getCellBounds(r, c);
                    if (!bounds) continue;

                    let textColor = cell.textColor;
                    let fontWeight = cell.fontWeight;

                    if (this.hasHeaderRow && r === 0) {
                        textColor = this.headerTextColor;
                        fontWeight = 'bold';
                    }

                    const text = new fabric.Textbox(cell.content, {
                        left: bounds.left + this.cellPadding,
                        top: bounds.top + this.cellPadding,
                        width: bounds.width - (this.cellPadding * 2),
                        fontSize: cell.fontSize,
                        fontFamily: 'Arial',
                        fill: textColor,
                        fontWeight: fontWeight,
                        splitByGrapheme: true,
                        selectable: false
                    });
                    this.add(text);
                    this._cellText.push(text);
                }
            }
        }
    }

    private _renderSelection() {
        if (!this.selectionRange) return;

        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        const r1 = Math.min(startRow, endRow);
        const r2 = Math.max(startRow, endRow);
        const c1 = Math.min(startCol, endCol);
        const c2 = Math.max(startCol, endCol);

        const startBounds = this.getCellBounds(r1, c1);
        const endBounds = this.getCellBounds(r2, c2);

        if (startBounds && endBounds) {
            const width = (endBounds.left + endBounds.width) - startBounds.left;
            const height = (endBounds.top + endBounds.height) - startBounds.top;

            const highlight = new fabric.Rect({
                left: startBounds.left,
                top: startBounds.top,
                width: width,
                height: height,
                fill: 'rgba(0, 120, 215, 0.1)',
                stroke: '#0078d7',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            this.add(highlight);
        }
    }

    public bindToDataSource(dataSourceId: string, mapping: Record<number, string>) {
        this.dataSourceId = dataSourceId;
        this.columnMapping = mapping;
        this.refreshData();
    }

    public refreshData() {
        if (!this.dataSourceId) {
            this._initTable();
            return;
        }

        const store = useMailMergeStore.getState();
        const dataRows = store.filteredRows;

        if (!dataRows || dataRows.length === 0) {
            this._initTable();
            return;
        }

        const count = Math.min(dataRows.length, this.visibleRowCount);
        const dataToDisplay = dataRows.slice(0, count);

        const startDataRow = this.hasHeaderRow ? 1 : 0;
        const totalRowsNeeded = startDataRow + dataToDisplay.length;

        while (this.rows < totalRowsNeeded) {
            this.addRow();
        }
        while (this.rows > totalRowsNeeded) {
            this.deleteRow(this.rows - 1);
        }

        for (let i = 0; i < dataToDisplay.length; i++) {
            const tableRowIdx = i + startDataRow;
            const dataRow = dataToDisplay[i];

            for (const [colIdxStr, fieldName] of Object.entries(this.columnMapping)) {
                const colIdx = parseInt(colIdxStr);
                if (colIdx < this.columns && dataRow[fieldName] !== undefined) {
                    this.cells[tableRowIdx][colIdx].content = String(dataRow[fieldName]);
                    this.cells[tableRowIdx][colIdx].isPlaceholder = false;
                }
            }
        }

        this._initTable();
    }

    public getCellBounds(row: number, col: number): { left: number, top: number, width: number, height: number } | null {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) {
            return null;
        }

        const cell = this.cells[row][col];
        const totalWidth = this.columnWidths.reduce((a, b) => a + b, 0);
        const totalHeight = this.rowHeights.reduce((a, b) => a + b, 0);

        let x = -totalWidth / 2;
        for (let c = 0; c < col; c++) x += this.columnWidths[c];

        let y = -totalHeight / 2;
        for (let r = 0; r < row; r++) y += this.rowHeights[r];

        let height = 0;
        for (let r = 0; r < cell.rowSpan; r++) {
            if (row + r < this.rows) height += this.rowHeights[row + r];
        }

        let width = 0;
        for (let c = 0; c < cell.colSpan; c++) {
            if (col + c < this.columns) width += this.columnWidths[col + c];
        }

        return {
            left: x,
            top: y,
            width: width,
            height: height
        };
    }

    public getCellAt(x: number, y: number): { row: number, col: number } | null {
        const totalWidth = this.columnWidths.reduce((a, b) => a + b, 0);
        const totalHeight = this.rowHeights.reduce((a, b) => a + b, 0);

        const localX = x + totalWidth / 2;
        const localY = y + totalHeight / 2;

        if (localX < 0 || localX > totalWidth || localY < 0 || localY > totalHeight) {
            return null;
        }

        let currentX = 0;
        let colIndex = -1;
        for (let c = 0; c < this.columns; c++) {
            if (localX >= currentX && localX <= currentX + this.columnWidths[c]) {
                colIndex = c;
                break;
            }
            currentX += this.columnWidths[c];
        }

        let currentY = 0;
        let rowIndex = -1;
        for (let r = 0; r < this.rows; r++) {
            if (localY >= currentY && localY <= currentY + this.rowHeights[r]) {
                rowIndex = r;
                break;
            }
            currentY += this.rowHeights[r];
        }

        if (rowIndex !== -1 && colIndex !== -1) {
            return { row: rowIndex, col: colIndex };
        }
        return null;
    }

    public getDividerAt(x: number, y: number): { type: 'row' | 'col', index: number } | null {
        const totalWidth = this.columnWidths.reduce((a, b) => a + b, 0);
        const totalHeight = this.rowHeights.reduce((a, b) => a + b, 0);

        const localX = x + totalWidth / 2;
        const localY = y + totalHeight / 2;

        if (localX < -5 || localX > totalWidth + 5 || localY < -5 || localY > totalHeight + 5) return null;

        const tolerance = 5;

        let currentX = 0;
        for (let c = 0; c < this.columns - 1; c++) {
            currentX += this.columnWidths[c];
            if (Math.abs(localX - currentX) <= tolerance) {
                return { type: 'col', index: c };
            }
        }

        let currentY = 0;
        for (let r = 0; r < this.rows - 1; r++) {
            currentY += this.rowHeights[r];
            if (Math.abs(localY - currentY) <= tolerance) {
                return { type: 'row', index: r };
            }
        }

        return null;
    }

    public resizeColumn(colIndex: number, newWidth: number) {
        if (colIndex < 0 || colIndex >= this.columns) return;
        this.columnWidths[colIndex] = Math.max(20, newWidth);
        this._initTable();
        this.setCoords();
    }

    public resizeRow(rowIndex: number, newHeight: number) {
        if (rowIndex < 0 || rowIndex >= this.rows) return;
        this.rowHeights[rowIndex] = Math.max(20, newHeight);
        this._initTable();
        this.setCoords();
    }

    public setCellContent(row: number, col: number, text: string) {
        if (this.cells[row] && this.cells[row][col]) {
            this.cells[row][col].content = text;
            this._initTable();
        }
    }

    public setCellProperty(row: number, col: number, property: string, value: any) {
        if (this.cells[row] && this.cells[row][col]) {
            (this.cells[row][col] as any)[property] = value;
            this._initTable();
        }
    }

    public setActiveCell(row: number | null, col: number | null) {
        if (this.activeCell?.row === row && this.activeCell?.col === col) return;

        if (row === null || col === null) {
            this.activeCell = null;
            this.selectionRange = null;
        } else {
            this.activeCell = { row, col };
            this.selectionRange = { startRow: row, startCol: col, endRow: row, endCol: col };
        }
        this._initTable();
    }

    public mergeSelectedCells() {
        if (!this.selectionRange) return;
        const { startRow, startCol, endRow, endCol } = this.selectionRange;
        this.mergeCells(startRow, startCol, endRow, endCol);
    }

    public mergeCells(startRow: number, startCol: number, endRow: number, endCol: number) {
        const r1 = Math.min(startRow, endRow);
        const r2 = Math.max(startRow, endRow);
        const c1 = Math.min(startCol, endCol);
        const c2 = Math.max(startCol, endCol);

        if (r1 < 0 || r2 >= this.rows || c1 < 0 || c2 >= this.columns) return;
        if (r1 === r2 && c1 === c2) return;

        const head = this.cells[r1][c1];
        head.rowSpan = r2 - r1 + 1;
        head.colSpan = c2 - c1 + 1;

        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                if (r === r1 && c === c1) continue;
                this.cells[r][c].hidden = true;
            }
        }

        this.activeCell = { row: r1, col: c1 };
        this.selectionRange = { startRow: r1, startCol: c1, endRow: r1, endCol: r1 };
        this._initTable();
    }

    public unmergeCells(row: number, col: number) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) return;
        const cell = this.cells[row][col];
        if (cell.rowSpan === 1 && cell.colSpan === 1) return;

        const rs = cell.rowSpan;
        const cs = cell.colSpan;
        cell.rowSpan = 1;
        cell.colSpan = 1;

        for (let r = row; r < row + rs; r++) {
            for (let c = col; c < col + cs; c++) {
                if (r < this.rows && c < this.columns) {
                    this.cells[r][c].hidden = false;
                }
            }
        }

        this._initTable();
    }

    public enterCellEditing(row: number, col: number) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) return;
        if (!this.canvas) return;

        const cell = this.cells[row][col];
        const bounds = this.getCellBounds(row, col);
        if (!bounds) return;

        const canvas = this.canvas;
        const groupMatrix = this.calcTransformMatrix();

        const localPoint = new fabric.Point(bounds.left + this.cellPadding, bounds.top + this.cellPadding);
        const absolutePoint = fabric.util.transformPoint(localPoint, groupMatrix);

        this._editingCell = { row, col };
        this._initTable();

        const itext = new fabric.IText(cell.content || '', {
            left: absolutePoint.x,
            top: absolutePoint.y,
            width: bounds.width - (this.cellPadding * 2),
            fontSize: cell.fontSize,
            fontFamily: 'Arial',
            fill: cell.textColor,
            fontWeight: cell.fontWeight as any,
            textAlign: cell.textAlign as any,
            selectable: true,
            hasControls: false,
            hasBorders: false,
        });

        canvas.add(itext);
        canvas.setActiveObject(itext);
        itext.enterEditing();
        itext.selectAll();

        itext.on('editing:exited', () => {
            this.setCellContent(row, col, itext.text || '');
            canvas.remove(itext);
            this._editingCell = null;
            this._initTable();
            canvas.requestRenderAll();
        });
    }

    toObject(propertiesToInclude: string[] = []) {
        return super.toObject([
            'type', 'elementType', 'rows', 'columns', 'rowHeights', 'columnWidths', 'cells',
            'dataSourceId', 'columnMapping', 'visibleRowCount',
            'hasHeaderRow', 'headerBackgroundColor', 'headerTextColor',
            'alternateRows', 'alternateRowBackgroundColor',
            ...propertiesToInclude
        ]);
    }

    static fromObject(object: any, callback: (obj: FabricTable) => void) {
        const table = new FabricTable(object, object);
        callback(table);
    }
}

// Register class
(fabric as any).Table = FabricTable;
(fabric as any).Table.fromObject = FabricTable.fromObject;
(fabric as any).FabricTable = FabricTable;
(fabric as any).FabricTable.fromObject = FabricTable.fromObject;
FabricTable.prototype.type = 'table';
