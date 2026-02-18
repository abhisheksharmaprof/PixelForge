import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Document,
    Packer,
    Paragraph,
    ImageRun,
    TextRun,
    AlignmentType,
    FrameAnchorType,
    HorizontalPositionRelativeFrom,
    VerticalPositionRelativeFrom
} from 'docx';
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

// Conversion factor: 1 CSS pixel = 15 Twips in Word
const PX_TO_TWIPS = 15;

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
 * Text objects become editable TextRuns with absolute positioning via frames, 
 * images are embedded with floating positioning.
 */
export async function generateWord(
    fabricCanvas: fabric.Canvas,
    width: number,
    height: number,
    filename: string
): Promise<Blob> {
    const objects = fabricCanvas.getObjects();
    const docChildren: Paragraph[] = [];

    // Process objects
    for (const obj of objects) {
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

            // Determine alignment
            let alignment: typeof AlignmentType.LEFT | typeof AlignmentType.CENTER | typeof AlignmentType.RIGHT | typeof AlignmentType.JUSTIFIED = AlignmentType.LEFT;
            if (textObj.textAlign === 'center') alignment = AlignmentType.CENTER;
            else if (textObj.textAlign === 'right') alignment = AlignmentType.RIGHT;
            else if (textObj.textAlign === 'justify') alignment = AlignmentType.JUSTIFIED;

            // Absolute positioning using frames
            // We use the object's top/left relative to the page
            docChildren.push(
                new Paragraph({
                    frame: {
                        type: "absolute",
                        position: {
                            x: Math.round((obj.left || 0) * PX_TO_TWIPS),
                            y: Math.round((obj.top || 0) * PX_TO_TWIPS),
                        },
                        width: Math.round((obj.width || 100) * (obj.scaleX || 1) * PX_TO_TWIPS),
                        height: Math.round((obj.height || 20) * (obj.scaleY || 1) * PX_TO_TWIPS),
                        anchor: {
                            horizontal: FrameAnchorType.PAGE,
                            vertical: FrameAnchorType.PAGE,
                        },
                    },
                    alignment,
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

                    const objWidth = (imgObj.width || 0) * (imgObj.scaleX || 1);
                    const objHeight = (imgObj.height || 0) * (imgObj.scaleY || 1);

                    docChildren.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: bytes,
                                    transformation: {
                                        width: objWidth,
                                        height: objHeight,
                                    },
                                    floating: {
                                        horizontalPosition: {
                                            relative: HorizontalPositionRelativeFrom.PAGE,
                                            offset: Math.round((obj.left || 0) * PX_TO_TWIPS),
                                        },
                                        verticalPosition: {
                                            relative: VerticalPositionRelativeFrom.PAGE,
                                            offset: Math.round((obj.top || 0) * PX_TO_TWIPS),
                                        },
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
                            width: Math.round(width * PX_TO_TWIPS),
                            height: Math.round(height * PX_TO_TWIPS),
                        },
                        margin: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
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
