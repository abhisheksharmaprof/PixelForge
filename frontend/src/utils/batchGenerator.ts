import { fabric } from 'fabric';
import { DataSource, GenerationConfig, GenerationProgress, ConditionalRule } from '../types/mailMergeTypes';
import { useMailMergeStore } from '../store/mailMergeStore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// we need to import jsPDF but it might not be installed. 
// For now we will assume image export and basic PDF text if possible, or just images in ZIP.
// If jsPDF is needed we might need to install it. 
// "jspdf": "^2.5.1" is common. I will use a placeholder or assume it's available via window or similar if I can't check package.json.
// Actually, I can check package.json.

export class BatchGenerator {
    private canvas: fabric.Canvas;
    private config: GenerationConfig;
    private data: any[];
    private template: any;
    private rules: ConditionalRule[];
    private onProgress: (progress: GenerationProgress) => void;
    private isCancelled = false;

    constructor(
        canvas: fabric.Canvas, // We need a canvas instance to render
        templateJson: any,
        data: any[],
        rules: ConditionalRule[],
        config: GenerationConfig,
        onProgress: (progress: GenerationProgress) => void
    ) {
        // Create a hidden canvas for processing
        this.canvas = new fabric.Canvas(null, {
            width: canvas.getWidth(),
            height: canvas.getHeight(),
        });
        this.template = templateJson;
        this.data = data;
        this.rules = rules;
        this.config = config;
        this.onProgress = onProgress;
    }

    public cancel() {
        this.isCancelled = true;
    }

    public async process(): Promise<void> {
        const total = this.data.length;
        const zip = new JSZip();

        let successCount = 0;
        let errorCount = 0;
        const generatedFiles: any[] = [];

        const startTime = Date.now();

        // Load template once
        await this.loadTemplate(this.template);

        for (let i = 0; i < total; i++) {
            if (this.isCancelled) break;

            const record = this.data[i];
            const currentRecord = i + 1;

            try {
                // Apply data to canvas
                await this.applyDataToCanvas(record);

                // Render
                const filename = this.getFilename(record, i);
                const blob = await this.renderCanvas();

                if (blob) {
                    zip.file(filename, blob);
                    generatedFiles.push({ recordIndex: i, filename, size: blob.size, blob });
                    successCount++;
                } else {
                    errorCount++;
                }

            } catch (err) {
                console.error(`Error processing record ${i}:`, err);
                errorCount++;
            }

            // Update progress
            const elapsed = Date.now() - startTime;
            const avgTime = elapsed / (i + 1);
            const remaining = (total - (i + 1)) * avgTime;

            this.onProgress({
                status: 'generating',
                currentRecord,
                totalRecords: total,
                percentage: Math.round((currentRecord / total) * 100),
                elapsedTime: elapsed,
                estimatedRemaining: remaining,
                speed: 1000 / avgTime,
                successCount,
                errorCount,
                warningCount: 0,
                errors: [], // populate if needed
                generatedFiles
            });

            // Yield to main thread to keep UI responsive
            await new Promise(r => setTimeout(r, 0));
        }

        if (this.isCancelled) {
            this.onProgress({ ...this.getLastProgress(), status: 'paused' });
            return;
        }

        // Generate final zip
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `batch_export_${Date.now()}.zip`);

        this.onProgress({ ...this.getLastProgress(), status: 'completed', percentage: 100 });
    }

    private getLastProgress(): GenerationProgress {
        return {
            status: 'generating',
            currentRecord: 0,
            totalRecords: 0,
            percentage: 0,
            elapsedTime: 0,
            estimatedRemaining: 0,
            speed: 0,
            successCount: 0,
            errorCount: 0,
            warningCount: 0,
            errors: [],
            generatedFiles: []
        };
    }

    private getFilename(record: any, index: number): string {
        // Simple replacement of {{field}} in pattern
        let name = this.config.filenamePattern || 'record_{{index}}';
        name = name.replace('{{index}}', (index + 1).toString());

        // Replace fields
        Object.keys(record).forEach(key => {
            name = name.replace(`{{${key}}}`, record[key]);
        });

        // Extension
        const ext = this.config.format === 'jpeg' ? 'jpg' : this.config.format;
        return `${name}.${ext}`;
    }

    private loadTemplate(json: any): Promise<void> {
        return new Promise((resolve) => {
            this.canvas.loadFromJSON(json, () => {
                resolve();
            });
        });
    }

    private async applyDataToCanvas(record: any) {
        const objects = this.canvas.getObjects();

        // 1. Text Substitution
        objects.forEach(obj => {
            if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
                const textObj = obj as fabric.IText;
                // Check if it's a bound field
                const binding = (textObj as any).fieldBinding;

                if (binding && record[binding] !== undefined) {
                    textObj.set('text', String(record[binding]));
                } else if (textObj.text?.includes('{{')) {
                    // Fallback: Regex replace
                    let newText = textObj.text || '';
                    Object.keys(record).forEach(key => {
                        // regex global replace
                        newText = newText.replace(new RegExp(`{{${key}}}`, 'g'), String(record[key]));
                    });
                    textObj.set('text', newText);
                }
            }
        });

        // 2. Conditional Logic (Show/Hide)
        this.rules.forEach(rule => {
            if (!rule.isEnabled) return;

            // Evaluate condition
            const isMatch = this.evaluateCondition(rule, record);
            const shouldShow = rule.action === 'show' ? isMatch : !isMatch;

            rule.affectedElements.forEach(id => {
                // Find object by custom id or some other identifier
                // Fabric objects don't always have 'id'. We might need to rely on usage of 'name' or custom property.
                // For now, let's assume we match against (obj as any).id
                const target = objects.find(o => (o as any).id === id);
                if (target) {
                    target.visible = shouldShow;
                }
            });
        });

        // 3. Image Replacement
        const imageUpdates = objects.map(obj => {
            // @ts-ignore
            if (obj.elementType === 'mailmerge-image-placeholder' && obj.fieldBinding) {
                // @ts-ignore
                const binding = obj.fieldBinding;
                const url = record[binding];

                if (url) {
                    return new Promise<void>(resolve => {
                        fabric.Image.fromURL(url, (img) => {
                            if (!img) { resolve(); return; }

                            // Fit image to placeholder bounds (Stretching for now to ensure exact fit)
                            // A better approach would be 'cover' with a crop, but that requires clipPath logic.
                            const placeholderWidth = obj.getScaledWidth();
                            const placeholderHeight = obj.getScaledHeight();

                            // Apply grayscale if needed
                            if ((obj as any).grayscale) {
                                img.filters?.push(new fabric.Image.filters.Grayscale());
                                img.applyFilters();
                            }

                            img.set({
                                left: obj.left,
                                top: obj.top,
                                scaleX: placeholderWidth / (img.width || 1),
                                scaleY: placeholderHeight / (img.height || 1),
                                angle: obj.angle,
                                opacity: obj.opacity,
                                originX: obj.originX,
                                originY: obj.originY,
                            });

                            this.canvas.remove(obj);
                            this.canvas.add(img);
                            resolve();
                        }, { crossOrigin: 'anonymous' });
                    });
                }
            }
            return Promise.resolve();
        });

        await Promise.all(imageUpdates);

        this.canvas.renderAll();
    }

    private evaluateCondition(rule: ConditionalRule, record: any): boolean {
        if (rule.conditions.length === 0) return true;

        // Handle single condition
        if (rule.conditions.length === 1) {
            return this.checkCondition(rule.conditions[0], record);
        }

        // Handle multiple conditions
        if (rule.logicOperator === 'AND') {
            return rule.conditions.every(c => this.checkCondition(c, record));
        } else {
            return rule.conditions.some(c => this.checkCondition(c, record));
        }
    }

    private checkCondition(c: any, record: any): boolean {
        const val = record[c.field];
        const compare = c.value;

        switch (c.operator) {
            case 'equals': return String(val) == compare;
            case 'notEquals': return String(val) != compare;
            case 'contains': return String(val).includes(compare);
            case 'greaterThan': return Number(val) > Number(compare);
            case 'lessThan': return Number(val) < Number(compare);
            case 'greaterOrEqual': return Number(val) >= Number(compare);
            case 'lessOrEqual': return Number(val) <= Number(compare);
            case 'isEmpty': return !val || val === '';
            case 'isNotEmpty': return !!val && val !== '';
            default: return false;
        }
    }

    private renderCanvas(): Promise<Blob | null> {
        return new Promise(resolve => {
            if (this.config.format === 'svg') {
                const svg = this.canvas.toSVG();
                resolve(new Blob([svg], { type: 'image/svg+xml' }));
                return;
            }

            const format = this.config.format === 'jpeg' ? 'jpeg' : 'png';
            const quality = (this.config.quality || 80) / 100;
            const multiplier = (this.config.resolution || 72) / 72; // basic DPI scaling

            const dataUrl = this.canvas.toDataURL({
                format: format,
                quality: quality,
                multiplier: multiplier
            });

            // Convert Base64 to Blob
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => resolve(blob))
                .catch(e => resolve(null));
        });
    }
}
