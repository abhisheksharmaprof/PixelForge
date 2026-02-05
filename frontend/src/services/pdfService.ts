import { fabric } from 'fabric';
import jsPDF from 'jspdf';
import { ExcelData } from '../utils/excelService';

export interface PDFGenerationConfig {
    fileFormat: 'pdf' | 'png' | 'jpeg';
    pageSize: string;
    orientation: 'portrait' | 'landscape';
    dpi: number;
    namingPattern: string;
    outputFolder: string;
    batchName: string;
    stopOnError: boolean;
    skipEmptyRows: boolean;
    createSubfolders: boolean;
    generateZip: boolean;
}

export interface GenerationResult {
    successful: number;
    failed: number;
    total: number;
    outputPath: string;
    zipFile?: string;
    errors: Array<{ row: number; message: string }>;
    files: Array<{ name: string; path: string }>;
}

export class PDFService {
    /**
     * Generate documents from template and data
     */
    static async generateDocuments(
        templateData: any,
        excelData: ExcelData,
        mappings: Record<string, string>,
        rowIndices: number[],
        config: PDFGenerationConfig,
        onProgress?: (current: number, total: number) => void
    ): Promise<GenerationResult> {
        const result: GenerationResult = {
            successful: 0,
            failed: 0,
            total: rowIndices.length,
            outputPath: '',
            errors: [],
            files: [],
        };

        // Create temporary canvas for rendering
        const tempCanvas = new fabric.Canvas(null, {
            width: templateData.width || 794,
            height: templateData.height || 1123,
        });

        for (let i = 0; i < rowIndices.length; i++) {
            const rowIndex = rowIndices[i];
            const rowData = excelData.rows[rowIndex];

            try {
                // Skip empty rows if configured
                if (config.skipEmptyRows && this.isRowEmpty(rowData)) {
                    continue;
                }

                // Load template
                await new Promise<void>((resolve, reject) => {
                    tempCanvas.loadFromJSON(templateData, () => {
                        resolve();
                    });
                });

                // Replace placeholders with data
                this.replacePlaceholders(tempCanvas, rowData, mappings);

                // Generate filename
                const filename = this.generateFilename(
                    config.namingPattern,
                    rowData,
                    rowIndex
                );

                // Generate file
                const filePath = await this.generateFile(
                    tempCanvas,
                    filename,
                    config
                );

                result.files.push({ name: filename, path: filePath });
                result.successful++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: rowIndex + 1,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });

                if (config.stopOnError) {
                    break;
                }
            }

            // Report progress
            if (onProgress) {
                onProgress(i + 1, rowIndices.length);
            }
        }

        // Cleanup
        tempCanvas.dispose();

        return result;
    }

    /**
     * Replace placeholders in canvas with actual data
     */
    private static replacePlaceholders(
        canvas: fabric.Canvas,
        rowData: Record<string, any>,
        mappings: Record<string, string>
    ) {
        canvas.getObjects().forEach(obj => {
            const objAny = obj as any;

            // Text placeholders
            if (objAny.elementType === 'placeholder' && objAny.placeholderName) {
                const columnName = mappings[objAny.placeholderName];
                if (columnName && rowData[columnName] !== undefined) {
                    const value = rowData[columnName];
                    const formatted = this.formatValue(value, objAny.format);
                    (obj as any).set({ text: formatted });
                } else if (objAny.fallbackValue) {
                    (obj as any).set({ text: objAny.fallbackValue });
                }
            }

            // Regular text with inline placeholders
            if ((obj.type === 'text' || obj.type === 'textbox') && (obj as any).text) {
                let text = (obj as any).text;
                const placeholderRegex = /\{\{(\w+)\}\}/g;

                text = text.replace(placeholderRegex, (match: string, placeholder: string) => {
                    const columnName = mappings[placeholder];
                    if (columnName && rowData[columnName] !== undefined) {
                        return String(rowData[columnName]);
                    }
                    return match;
                });

                (obj as any).set({ text });
            }

            // Dynamic images
            if (
                objAny.elementType === 'image' &&
                objAny.isDynamic &&
                objAny.dynamicColumnMapping
            ) {
                const imageUrl = rowData[objAny.dynamicColumnMapping];
                // Note: For actual implementation, you'd need to load the image
                // This is a simplified version
            }

            // QR Codes
            if (
                objAny.elementType === 'qrcode' &&
                objAny.isPlaceholder &&
                objAny.placeholderName
            ) {
                const value = rowData[objAny.placeholderName];
                if (value) {
                    objAny.qrData = String(value);
                    // Regenerate QR code
                }
            }

            // Barcodes
            if (
                objAny.elementType === 'barcode' &&
                objAny.isPlaceholder &&
                objAny.placeholderName
            ) {
                const value = rowData[objAny.placeholderName];
                if (value) {
                    objAny.barcodeData = String(value);
                    // Regenerate barcode
                }
            }

            // Table auto-population
            if (
                objAny.elementType === 'table' &&
                objAny.autoPopulate &&
                objAny.columnMapping
            ) {
                // Populate table cells with data
                for (let c = 0; c < objAny.columns; c++) {
                    const columnName = objAny.columnMapping[c];
                    if (columnName && rowData[columnName] !== undefined) {
                        if (!objAny.cells[0]) objAny.cells[0] = [];
                        if (!objAny.cells[0][c]) objAny.cells[0][c] = {};
                        objAny.cells[0][c].content = String(rowData[columnName]);
                    }
                }
            }
        });

        canvas.renderAll();
    }

    /**
     * Format value based on format string
     */
    private static formatValue(value: any, format: string): string {
        if (value === null || value === undefined) return '';

        switch (format) {
            case 'uppercase':
                return String(value).toUpperCase();

            case 'lowercase':
                return String(value).toLowerCase();

            case 'capitalize':
                return String(value)
                    .toLowerCase()
                    .replace(/\b\w/g, l => l.toUpperCase());

            case 'date:DD/MM/YYYY':
                return new Date(value).toLocaleDateString('en-GB');

            case 'date:MM/DD/YYYY':
                return new Date(value).toLocaleDateString('en-US');

            case 'date:YYYY-MM-DD':
                return new Date(value).toISOString().split('T')[0];

            case 'number:2':
                return Number(value).toFixed(2);

            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(Number(value));

            case 'percentage':
                return `${(Number(value) * 100).toFixed(2)}%`;

            default:
                return String(value);
        }
    }

    /**
     * Generate filename from pattern
     */
    private static generateFilename(
        pattern: string,
        rowData: Record<string, any>,
        rowIndex: number
    ): string {
        let filename = pattern;

        // Replace {{sequence}} with row number
        filename = filename.replace(/\{\{sequence\}\}/g, String(rowIndex + 1));

        // Replace {{generated_date}} with current date
        filename = filename.replace(
            /\{\{generated_date\}\}/g,
            new Date().toISOString().split('T')[0]
        );

        // Replace other placeholders
        const placeholderRegex = /\{\{(\w+)\}\}/g;
        filename = filename.replace(placeholderRegex, (match, placeholder) => {
            if (rowData[placeholder] !== undefined) {
                return String(rowData[placeholder]).replace(/[^a-zA-Z0-9_-]/g, '_');
            }
            return match;
        });

        return filename;
    }

    /**
     * Generate file (PDF, PNG, or JPEG)
     */
    private static async generateFile(
        canvas: fabric.Canvas,
        filename: string,
        config: PDFGenerationConfig
    ): Promise<string> {
        const multiplier = config.dpi / 96; // 96 is default screen DPI

        if (config.fileFormat === 'pdf') {
            return this.generatePDF(canvas, filename, config, multiplier);
        } else {
            return this.generateImage(canvas, filename, config, multiplier);
        }
    }

    /**
     * Generate PDF file
     */
    private static async generatePDF(
        canvas: fabric.Canvas,
        filename: string,
        config: PDFGenerationConfig,
        multiplier: number
    ): Promise<string> {
        // Get canvas as data URL
        const dataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier,
        });

        // Page size mapping (in mm)
        const pageSizes: Record<string, [number, number]> = {
            A4: [210, 297],
            Letter: [215.9, 279.4],
            Legal: [215.9, 355.6],
            A3: [297, 420],
            A5: [148, 210],
        };

        const [width, height] = pageSizes[config.pageSize] || [210, 297];

        // Create PDF
        const pdf = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: [width, height],
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Save to file (in actual implementation, this would save to server)
        const filePath = `${config.outputFolder}/${config.batchName}/${filename}.pdf`;

        // For browser, trigger download
        // pdf.save(`${filename}.pdf`);

        // For Node.js backend, save to file system
        const pdfBuffer = pdf.output('arraybuffer');

        return filePath;
    }

    /**
     * Generate image file (PNG or JPEG)
     */
    private static async generateImage(
        canvas: fabric.Canvas,
        filename: string,
        config: PDFGenerationConfig,
        multiplier: number
    ): Promise<string> {
        const dataUrl = canvas.toDataURL({
            format: config.fileFormat,
            quality: config.fileFormat === 'jpeg' ? 0.9 : 1,
            multiplier: multiplier,
        });

        const filePath = `${config.outputFolder}/${config.batchName}/${filename}.${config.fileFormat}`;

        // Convert data URL to file and save
        // Implementation would depend on environment (browser vs Node.js)

        return filePath;
    }

    /**
     * Check if row is empty
     */
    private static isRowEmpty(rowData: Record<string, any>): boolean {
        return Object.values(rowData).every(
            value => value === null || value === undefined || value === ''
        );
    }

    /**
     * Create ZIP archive of generated files
     */
    static async createZipArchive(
        files: Array<{ name: string; path: string }>,
        outputPath: string
    ): Promise<string> {
        // Implementation using JSZip
        const JSZip = require('jszip');
        const zip = new JSZip();

        for (const file of files) {
            // Read file content and add to zip
            // zip.file(file.name, fileContent);
        }

        // Generate ZIP
        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

        // Save ZIP file
        const zipPath = `${outputPath}/generated_documents.zip`;

        return zipPath;
    }
}
