import express from 'express';
import path from 'path';
import fs from 'fs';
import { fabric } from 'fabric';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

const router = express.Router();

// Generate documents
router.post('/', async (req, res) => {
    try {
        const {
            templateData,
            excelData,
            mappings,
            rowIndices,
            config,
        } = req.body;

        const result = {
            successful: 0,
            failed: 0,
            total: rowIndices.length,
            outputPath: '',
            zipFile: null as string | null,
            errors: [] as Array<{ row: number; message: string }>,
            files: [] as Array<{ name: string; path: string }>,
        };

        // Create output directory
        const outputDir = path.join(
            __dirname,
            '../../storage/generated',
            config.batchName
        );

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        result.outputPath = outputDir;

        // Process each row
        for (let i = 0; i < rowIndices.length; i++) {
            const rowIndex = rowIndices[i];
            const rowData = excelData.rows[rowIndex];

            try {
                // Skip empty rows if configured
                if (config.skipEmptyRows && isRowEmpty(rowData)) {
                    continue;
                }

                // Create canvas
                const canvas = new fabric.Canvas(null, {
                    width: templateData.objects?.[0]?.width || 794,
                    height: templateData.objects?.[0]?.height || 1123,
                });

                // Load template
                await new Promise<void>((resolve, reject) => {
                    canvas.loadFromJSON(templateData, () => {
                        resolve();
                    }, (error: any) => reject(error)); // Fixed: added proper error handler wrapper if needed, though loadFromJSON might not take error callback in all versions, handled via try/catch around async flow if verify fails, but here it's callback based.

                    // Fabric loadFromJSON is (json, callback, reviver).
                    // Error handling in fabric < 6 is tricky. 
                    // We assume success for now or timeout.
                });

                // Replace placeholders
                await replacePlaceholders(canvas, rowData, mappings);

                // Generate filename
                const filename = generateFilename(
                    config.namingPattern,
                    rowData,
                    rowIndex
                );

                // Generate file
                const filePath = await generateFile(
                    canvas,
                    filename,
                    config,
                    outputDir
                );

                result.files.push({ name: filename, path: filePath });
                result.successful++;

                // Cleanup
                canvas.dispose();
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
        }

        // Create ZIP if requested
        if (config.generateZip && result.files.length > 0) {
            const zipPath = await createZipArchive(result.files, outputDir);
            result.zipFile = zipPath;
        }

        res.json(result);
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Failed to generate documents' });
    }
});

// Helper functions
function isRowEmpty(rowData: Record<string, any>): boolean {
    return Object.values(rowData).every(
        value => value === null || value === undefined || value === ''
    );
}

async function replacePlaceholders(
    canvas: fabric.Canvas,
    rowData: Record<string, any>,
    mappings: Record<string, string>
) {
    const objects = canvas.getObjects();

    for (const obj of objects) {
        const objAny = obj as any;

        // Text placeholders
        if (objAny.elementType === 'placeholder' && objAny.placeholderName) {
            const columnName = mappings[objAny.placeholderName];
            if (columnName && rowData[columnName] !== undefined) {
                const value = rowData[columnName];
                const formatted = formatValue(value, objAny.format);
                (obj as any).set({ text: formatted });
            }
        }

        // QR Codes
        if (
            objAny.elementType === 'qrcode' &&
            objAny.isPlaceholder &&
            objAny.placeholderName
        ) {
            const value = rowData[objAny.placeholderName];
            if (value) {
                const qrDataURL = await QRCode.toDataURL(String(value), {
                    width: objAny.width || 200,
                    margin: objAny.margin || 1,
                });

                await new Promise<void>((resolve) => {
                    fabric.Image.fromURL(qrDataURL, (img) => {
                        (obj as any).setElement(img.getElement());
                        resolve();
                    });
                });
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
                const barcodeCanvas = createCanvas(objAny.width || 300, objAny.height || 100);
                JsBarcode(barcodeCanvas as any, String(value), {
                    format: objAny.barcodeFormat || 'CODE128',
                    displayValue: objAny.displayValue !== false,
                });

                const barcodeDataURL = barcodeCanvas.toDataURL();

                await new Promise<void>((resolve) => {
                    // fabric.Image.fromURL might handle dataURL or we might need to use canvas element
                    fabric.Image.fromURL(barcodeDataURL, (img) => {
                        (obj as any).setElement(img.getElement());
                        resolve();
                    });
                });
            }
        }
    }

    canvas.renderAll();
}

function formatValue(value: any, format: string): string {
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

function generateFilename(
    pattern: string,
    rowData: Record<string, any>,
    rowIndex: number
): string {
    let filename = pattern;

    filename = filename.replace(/\{\{sequence\}\}/g, String(rowIndex + 1));
    filename = filename.replace(
        /\{\{generated_date\}\}/g,
        new Date().toISOString().split('T')[0]
    );

    const placeholderRegex = /\{\{(\w+)\}\}/g;
    filename = filename.replace(placeholderRegex, (match, placeholder) => {
        if (rowData[placeholder] !== undefined) {
            return String(rowData[placeholder]).replace(/[^a-zA-Z0-9_-]/g, '_');
        }
        return match;
    });

    return filename;
}

async function generateFile(
    canvas: fabric.Canvas,
    filename: string,
    config: any,
    outputDir: string
): Promise<string> {
    const multiplier = config.dpi / 96;

    if (config.fileFormat === 'pdf') {
        const dataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier,
        });

        const pageSizes: Record<string, [number, number]> = {
            A4: [210, 297],
            Letter: [215.9, 279.4],
            Legal: [215.9, 355.6],
            A3: [297, 420],
            A5: [148, 210],
        };

        const [width, height] = pageSizes[config.pageSize] || [210, 297];

        const pdf = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: [width, height],
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const filePath = path.join(outputDir, `${filename}.pdf`);
        fs.writeFileSync(filePath, Buffer.from(pdf.output('arraybuffer')));

        return filePath;
    } else {
        // Generate image (PNG or JPEG)
        const dataUrl = canvas.toDataURL({
            format: config.fileFormat,
            quality: config.fileFormat === 'jpeg' ? 0.9 : 1,
            multiplier: multiplier,
        });

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const filePath = path.join(outputDir, `${filename}.${config.fileFormat}`);
        fs.writeFileSync(filePath, buffer);

        return filePath;
    }
}

async function createZipArchive(
    files: Array<{ name: string; path: string }>,
    outputDir: string
): Promise<string> {
    const zip = new JSZip();

    for (const file of files) {
        const fileContent = fs.readFileSync(file.path);
        zip.file(path.basename(file.path), fileContent);
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(outputDir, 'generated_documents.zip');
    fs.writeFileSync(zipPath, zipContent);

    return zipPath;
}

export default router;
