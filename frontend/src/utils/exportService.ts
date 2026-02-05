import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, ImageRun, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { fabric } from 'fabric';

export interface ExportOptions {
    format: 'pdf' | 'word';
    outputMode: 'single' | 'multiple'; // multiple = one file per record
    selectedRows: number[];
    namingColumn?: string; // Column to use for file naming
}

export interface GeneratedFile {
    name: string;
    blob: Blob;
}

/**
 * Renders a canvas element to an image data URL
 */
export async function canvasToImage(
    fabricCanvas: fabric.Canvas,
    width: number,
    height: number
): Promise<string> {
    // Export fabric canvas to data URL
    const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2, // Higher quality
    });
    return dataUrl;
}

/**
 * Generates a single PDF from canvas
 */
export async function generatePDF(
    imageDataUrl: string,
    width: number,
    height: number,
    filename: string
): Promise<Blob> {
    const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
    });

    pdf.addImage(imageDataUrl, 'PNG', 0, 0, width, height);

    return pdf.output('blob');
}

/**
 * Generates a multi-page PDF from multiple images
 */
export async function generateMultiPagePDF(
    images: { dataUrl: string; width: number; height: number; name: string }[]
): Promise<Blob> {
    if (images.length === 0) throw new Error('No images provided');

    const firstImg = images[0];
    const pdf = new jsPDF({
        orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [firstImg.width, firstImg.height],
    });

    images.forEach((img, index) => {
        if (index > 0) {
            pdf.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
        }
        pdf.addImage(img.dataUrl, 'PNG', 0, 0, img.width, img.height);
    });

    return pdf.output('blob');
}

/**
 * Generates a Word document with editable text elements extracted from canvas
 * Text objects become editable TextRuns, images are embedded as ImageRuns
 */
export async function generateWord(
    fabricCanvas: fabric.Canvas,
    width: number,
    height: number,
    filename: string
): Promise<Blob> {
    const objects = fabricCanvas.getObjects();
    const docChildren: Paragraph[] = [];

    // Sort objects by position (top to bottom, then left to right)
    const sortedObjects = [...objects].sort((a, b) => {
        const aTop = a.top || 0;
        const bTop = b.top || 0;
        if (Math.abs(aTop - bTop) < 20) {
            // Same row, sort by left
            return (a.left || 0) - (b.left || 0);
        }
        return aTop - bTop;
    });

    for (const obj of sortedObjects) {
        // Handle text objects
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
            const textObj = obj as fabric.IText;
            const text = textObj.text || '';

            if (!text.trim()) continue;

            // Extract styling
            const fontSize = (textObj.fontSize || 16) * 0.75; // Convert to points
            const fontFamily = textObj.fontFamily || 'Calibri';
            const isBold = textObj.fontWeight === 'bold' || textObj.fontWeight === 700;
            const isItalic = textObj.fontStyle === 'italic';
            const isUnderline = textObj.underline === true;
            const textColor = textObj.fill?.toString() || '#000000';

            // Convert hex color to RGB
            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 0, g: 0, b: 0 };
            };

            const rgb = hexToRgb(textColor);

            // Determine alignment
            let alignment: typeof AlignmentType.LEFT | typeof AlignmentType.CENTER | typeof AlignmentType.RIGHT | typeof AlignmentType.JUSTIFIED = AlignmentType.LEFT;
            if (textObj.textAlign === 'center') alignment = AlignmentType.CENTER;
            else if (textObj.textAlign === 'right') alignment = AlignmentType.RIGHT;
            else if (textObj.textAlign === 'justify') alignment = AlignmentType.JUSTIFIED;

            // Create paragraph with styled text
            docChildren.push(
                new Paragraph({
                    alignment,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({
                            text: text,
                            bold: isBold,
                            italics: isItalic,
                            underline: isUnderline ? {} : undefined,
                            size: Math.round(fontSize * 2), // docx uses half-points
                            font: fontFamily,
                            color: textColor.replace('#', ''),
                        }),
                    ],
                })
            );
        }

        // Handle image objects
        if (obj.type === 'image') {
            try {
                const imgObj = obj as fabric.Image;
                const imgElement = imgObj.getElement() as HTMLImageElement;

                // Create a canvas to get image data
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d');
                if (ctx && imgElement) {
                    tempCanvas.width = imgElement.naturalWidth || imgElement.width;
                    tempCanvas.height = imgElement.naturalHeight || imgElement.height;
                    ctx.drawImage(imgElement, 0, 0);

                    const dataUrl = tempCanvas.toDataURL('image/png');
                    const base64Data = dataUrl.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Scale image for Word
                    const maxWidth = 500;
                    const scale = Math.min(1, maxWidth / tempCanvas.width);
                    const scaledWidth = Math.round(tempCanvas.width * scale);
                    const scaledHeight = Math.round(tempCanvas.height * scale);

                    docChildren.push(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 },
                            children: [
                                new ImageRun({
                                    data: bytes,
                                    transformation: {
                                        width: scaledWidth,
                                        height: scaledHeight,
                                    },
                                    type: 'png',
                                }),
                            ],
                        })
                    );
                }
            } catch (e) {
                console.warn('Failed to export image to Word:', e);
            }
        }
    }

    // If no elements were extracted, add a placeholder
    if (docChildren.length === 0) {
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: 'Document content' })],
            })
        );
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: Math.round(width * 15), // Convert to twips (approx)
                            height: Math.round(height * 15),
                        },
                    },
                },
                children: docChildren,
            },
        ],
    });

    return await Packer.toBlob(doc);
}

/**
 * Downloads multiple files as a zip
 */
export async function downloadAsZip(files: GeneratedFile[], zipName: string): Promise<void> {
    const zip = new JSZip();

    files.forEach((file) => {
        zip.file(file.name, file.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, zipName);
}

/**
 * Downloads a single file
 */
export function downloadFile(blob: Blob, filename: string): void {
    saveAs(blob, filename);
}

/**
 * Sanitizes a string for use as a filename
 */
export function sanitizeFilename(name: string): string {
    return name
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 50);
}

/**
 * Gets the file extension for a format
 */
export function getExtension(format: 'pdf' | 'word'): string {
    return format === 'pdf' ? '.pdf' : '.docx';
}
