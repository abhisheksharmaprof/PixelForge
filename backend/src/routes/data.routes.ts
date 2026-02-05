import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

const router = express.Router();

// Type definitions
interface FileInfo {
    id: string;
    name: string;
    path: string;
    size: number;
    lastModified: Date;
}

interface ColumnInfo {
    name: string;
    type: string;
    sampleValue: any;
}

interface ParsedData {
    columns: ColumnInfo[];
    rows: Record<string, any>[];
}

// Upload Excel/CSV file (using express-fileupload)
router.post('/upload', async (req: Request, res: Response) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const uploadPath = path.join(__dirname, '../../storage/data/excel-files');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        const file = req.files.file as any;
        const uniqueName = `${uuidv4()}${path.extname(file.name)}`;
        const filePath = path.join(uploadPath, uniqueName);

        await file.mv(filePath);

        const fileExt = path.extname(file.name).toLowerCase();
        let data: ParsedData;

        if (fileExt === '.csv') {
            const text = fs.readFileSync(filePath, 'utf-8');
            data = parseCSV(text);
        } else {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, any>[];

            data = {
                rows: jsonData,
                columns: Object.keys(jsonData[0] || {}).map(name => ({
                    name,
                    type: detectColumnType(jsonData, name),
                    sampleValue: jsonData[0]?.[name],
                })),
            };
        }

        res.json({
            success: true,
            file: {
                id: path.parse(uniqueName).name,
                name: file.name,
                path: filePath,
                size: file.size,
                lastModified: new Date(),
            },
            data: {
                columns: data.columns,
                rows: data.rows,
                totalRows: data.rows.length,
                totalColumns: data.columns.length,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// Get uploaded files list
router.get('/files', (req: Request, res: Response) => {
    try {
        const dataPath = path.join(__dirname, '../../storage/data/excel-files');

        if (!fs.existsSync(dataPath)) {
            return res.json([]);
        }

        const files = fs.readdirSync(dataPath);
        const fileInfos: FileInfo[] = files.map(filename => {
            const filePath = path.join(dataPath, filename);
            const stats = fs.statSync(filePath);

            return {
                id: path.parse(filename).name,
                name: filename,
                path: filePath,
                size: stats.size,
                lastModified: stats.mtime,
            };
        });

        res.json(fileInfos);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Failed to get files' });
    }
});

// Get file data
router.get('/file/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const dataPath = path.join(__dirname, '../../storage/data/excel-files');

        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const files = fs.readdirSync(dataPath);
        const file = files.find(f => f.startsWith(id));

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.join(dataPath, file);
        const fileExt = path.extname(file).toLowerCase();

        let data: ParsedData;

        if (fileExt === '.csv') {
            const text = fs.readFileSync(filePath, 'utf-8');
            data = parseCSV(text);
        } else {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, any>[];

            data = {
                rows: jsonData,
                columns: Object.keys(jsonData[0] || {}).map(name => ({
                    name,
                    type: detectColumnType(jsonData, name),
                    sampleValue: jsonData[0]?.[name],
                })),
            };
        }

        res.json({
            columns: data.columns,
            rows: data.rows,
            totalRows: data.rows.length,
            totalColumns: data.columns.length,
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to get file data' });
    }
});

// Delete file
router.delete('/file/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const dataPath = path.join(__dirname, '../../storage/data/excel-files');

        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const files = fs.readdirSync(dataPath);
        const file = files.find(f => f.startsWith(id));

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.join(dataPath, file);
        fs.unlinkSync(filePath);

        res.json({ success: true });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Helper functions
function parseCSV(text: string): ParsedData {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { columns: [], rows: [] };

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, any> = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        rows.push(row);
    }

    const columns: ColumnInfo[] = headers.map(name => ({
        name,
        type: detectColumnType(rows, name),
        sampleValue: rows[0]?.[name],
    }));

    return { columns, rows };
}

function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function detectColumnType(data: Record<string, any>[], columnName: string): string {
    const samples = data
        .slice(0, Math.min(100, data.length))
        .map(row => row[columnName])
        .filter(val => val !== null && val !== undefined && val !== '');

    if (samples.length === 0) return 'string';

    const allNumbers = samples.every(val => !isNaN(Number(val)));
    if (allNumbers) return 'number';

    const allBooleans = samples.every(val =>
        ['true', 'false', '1', '0', 'yes', 'no'].includes(String(val).toLowerCase())
    );
    if (allBooleans) return 'boolean';

    const allDates = samples.every(val => !isNaN(Date.parse(String(val))));
    if (allDates) return 'date';

    return 'string';
}

export default router;
