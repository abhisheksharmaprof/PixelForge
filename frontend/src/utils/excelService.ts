import * as XLSX from 'xlsx';

export interface ExcelColumn {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    sampleValue: any;
}

export interface ExcelData {
    columns: ExcelColumn[];
    rows: Array<Record<string, any>>;
    rawRows: Array<any[]>; // Raw rows as arrays for header selection
    totalRows: number;
    totalColumns: number;
}

export class ExcelService {
    /**
     * Parse Excel file - returns raw data that can be processed with different header rows
     */
    static async parseExcelFile(file: File, headerRowIndex: number = 0): Promise<ExcelData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, {
                        type: 'binary',
                        cellDates: true,
                        cellNF: false,
                        cellText: false
                    });

                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Get the range of the sheet to find all columns
                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                    const totalColumns = range.e.c - range.s.c + 1;
                    const totalRows = range.e.r - range.s.r + 1;

                    // Convert to array of arrays (raw data without headers)
                    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1, // Use array of arrays
                        raw: true,
                        defval: '',
                    });

                    if (rawRows.length === 0) {
                        reject(new Error('Excel file is empty'));
                        return;
                    }

                    // Process with the specified header row
                    const result = this.processWithHeaderRow(rawRows, headerRowIndex, totalColumns);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsBinaryString(file);
        });
    }

    /**
     * Process raw rows with a specific header row index
     */
    static processWithHeaderRow(rawRows: any[][], headerRowIndex: number, totalColumns?: number): ExcelData {
        if (rawRows.length === 0) {
            return { columns: [], rows: [], rawRows: [], totalRows: 0, totalColumns: 0 };
        }

        // Find the maximum number of columns across all rows
        const maxCols = totalColumns || Math.max(...rawRows.map(row => row?.length || 0));

        // Ensure header row exists
        const headerRow = rawRows[headerRowIndex] || [];

        // Create column definitions from header row, filling in missing columns
        const columns: ExcelColumn[] = [];
        for (let i = 0; i < maxCols; i++) {
            const headerValue = headerRow[i];
            const colName = headerValue !== undefined && headerValue !== ''
                ? String(headerValue).trim()
                : `Column ${i + 1}`;

            columns.push({
                name: colName,
                type: 'string',
                sampleValue: ''
            });
        }

        // Convert data rows (everything after header row) to keyed objects
        const dataRows = rawRows.slice(headerRowIndex + 1).map(row => {
            const rowObj: Record<string, any> = {};
            columns.forEach((col, index) => {
                const val = row?.[index];
                // If it's a date from XLSX, keep it as is. sheet_to_json(..., {raw:true}) would be better but we use raw:1 for rawRows.
                rowObj[col.name] = val !== undefined ? val : '';
            });
            return rowObj;
        });

        // Detect column types from data rows
        columns.forEach((col, index) => {
            col.type = this.detectColumnType(dataRows, col.name);
            col.sampleValue = dataRows[0]?.[col.name] || '';
        });

        // Parse values with detected types
        const processedRows = dataRows.map(row => {
            const processedRow: Record<string, any> = {};
            columns.forEach(col => {
                processedRow[col.name] = this.parseValue(row[col.name], col.type);
            });
            return processedRow;
        });

        return {
            columns,
            rows: processedRows,
            rawRows,
            totalRows: processedRows.length,
            totalColumns: columns.length,
        };
    }

    /**
     * Parse CSV file
     */
    static async parseCSVFile(file: File): Promise<ExcelData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length === 0) {
                        reject(new Error('CSV file is empty'));
                        return;
                    }

                    // Parse headers
                    const headers = this.parseCSVLine(lines[0]);

                    // Parse rows
                    const rows: Array<Record<string, any>> = [];
                    for (let i = 1; i < lines.length; i++) {
                        const values = this.parseCSVLine(lines[i]);
                        const row: Record<string, any> = {};

                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });

                        rows.push(row);
                    }

                    // Build rawRows for CSV (as array of arrays)
                    const rawRows: any[][] = lines.map(line => this.parseCSVLine(line));

                    // Detect column types
                    const columns: ExcelColumn[] = headers.map(name => ({
                        name,
                        type: this.detectColumnType(rows, name),
                        sampleValue: rows[0]?.[name],
                    }));

                    // Process values with correct types
                    const processedRows = rows.map(row => {
                        const processedRow: Record<string, any> = {};
                        columns.forEach(col => {
                            processedRow[col.name] = this.parseValue(row[col.name], col.type);
                        });
                        return processedRow;
                    });

                    resolve({
                        columns,
                        rows: processedRows,
                        rawRows,
                        totalRows: processedRows.length,
                        totalColumns: columns.length,
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read CSV file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Parse CSV line handling quoted values
     */
    private static parseCSVLine(line: string): string[] {
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

    /**
     * Detect column data type
     */
    private static detectColumnType(
        data: Array<Record<string, any>>,
        columnName: string
    ): 'string' | 'number' | 'date' | 'boolean' {
        const samples = data
            .slice(0, Math.min(100, data.length))
            .map(row => row[columnName])
            .filter(val => val !== null && val !== undefined && val !== '');

        if (samples.length === 0) return 'string';

        // Check if all values are numbers
        const allNumbers = samples.every(val => !isNaN(Number(val)));
        if (allNumbers) return 'number';

        // Check if all values are booleans
        const allBooleans = samples.every(val =>
            ['true', 'false', '1', '0', 'yes', 'no'].includes(String(val).toLowerCase())
        );
        if (allBooleans) return 'boolean';

        // Check if all values are dates
        const allDates = samples.every(val => !isNaN(Date.parse(String(val))));
        if (allDates) return 'date';

        return 'string';
    }

    /**
     * Parse value based on type
     */
    private static parseValue(value: any, type?: string): any {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        switch (type) {
            case 'number':
                const num = Number(value);
                return isNaN(num) ? value : num;

            case 'boolean':
                const str = String(value).toLowerCase();
                if (['true', '1', 'yes'].includes(str)) return true;
                if (['false', '0', 'no'].includes(str)) return false;
                return value;

            case 'date':
                const date = new Date(value);
                return isNaN(date.getTime()) ? value : date;

            default:
                return String(value);
        }
    }

    /**
     * Export data to Excel
     */
    static exportToExcel(
        data: Array<Record<string, any>>,
        filename: string = 'export.xlsx'
    ) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, filename);
    }

    /**
     * Export data to CSV
     */
    static exportToCSV(
        data: Array<Record<string, any>>,
        filename: string = 'export.csv'
    ) {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Validate data against template placeholders
     */
    static validateData(
        data: ExcelData,
        requiredColumns: string[]
    ): { valid: boolean; missingColumns: string[] } {
        const columnNames = data.columns.map(col => col.name);
        const missingColumns = requiredColumns.filter(
            col => !columnNames.includes(col)
        );

        return {
            valid: missingColumns.length === 0,
            missingColumns,
        };
    }

    /**
     * Get column statistics
     */
    static getColumnStats(data: ExcelData, columnName: string) {
        const values = data.rows
            .map(row => row[columnName])
            .filter(val => val !== null && val !== undefined && val !== '');

        const column = data.columns.find(col => col.name === columnName);

        if (column?.type === 'number') {
            const numbers = values.map(Number).filter(n => !isNaN(n));
            return {
                count: values.length,
                unique: new Set(values).size,
                min: Math.min(...numbers),
                max: Math.max(...numbers),
                average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
                sum: numbers.reduce((a, b) => a + b, 0),
            };
        }

        return {
            count: values.length,
            unique: new Set(values).size,
            mostCommon: this.getMostCommonValue(values),
        };
    }

    /**
     * Get most common value
     */
    private static getMostCommonValue(values: any[]): any {
        const counts: Record<string, number> = {};
        values.forEach(val => {
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
        });

        let maxCount = 0;
        let mostCommon = null;

        Object.entries(counts).forEach(([value, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = value;
            }
        });

        return mostCommon;
    }
}
