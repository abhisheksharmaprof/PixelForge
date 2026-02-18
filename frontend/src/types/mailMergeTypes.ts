// ─── Data Source Types ───────────────────────────────────

export type DataSourceType = 'csv' | 'json' | 'excel' | 'api';
export type ConnectionStatus = 'connected' | 'pending' | 'error' | 'disconnected';

export interface DataSource {
    id: string;
    type: DataSourceType;
    name: string;
    status: ConnectionStatus;
    rowCount: number;
    lastUpdated: string; // ISO date
    file?: File;
    apiConfig?: ApiConfig;
    columns: DataColumn[];
    rows: Record<string, any>[];
    rawRows?: any[][];
}

export interface DataColumn {
    name: string;
    type: FieldType;
    sampleValues: string[];
    nonEmptyCount: number;
    emptyCount: number;
}

export interface ApiConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    authType: 'none' | 'basic' | 'bearer' | 'apiKey';
    authToken?: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    dataPath?: string; // JSON path to records array
}

// ─── Field Types ─────────────────────────────────────────

export type FieldType = 'text' | 'image' | 'number' | 'date' | 'boolean' | 'array';

export interface MailMergeField {
    id: string;
    name: string;          // e.g. "first_name"
    displayLabel: string;  // e.g. "First Name"
    type: FieldType;
    usageCount: number;
    isFavorite: boolean;
    sampleValues: string[];
    description?: string;
    defaultValue?: string;
    format?: string;
    // For text fields
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'titlecase';
    characterLimit?: number;
    minLength?: number;
    regexPattern?: string;
    overflowBehavior?: 'truncate' | 'ellipsis' | 'shrink' | 'wrap' | 'hide';
    // For image fields
    imageFit?: 'stretch' | 'fit' | 'fill' | 'contain' | 'cover' | 'original';
    imagePlaceholder?: string;
    opacity?: number;
    rotation?: number;
    grayscale?: boolean;
    // For number fields
    numberFormat?: 'auto' | 'integer' | '1decimal' | '2decimal' | 'currency' | 'percentage' | 'thousands';
    // For date fields
    dateFormat?: 'short' | 'long' | 'full' | 'time' | 'datetime' | 'iso' | 'custom';
    customDateFormat?: string;
}

// ─── Template Variables ──────────────────────────────────

export interface TemplateVariable {
    id: string;
    name: string;        // e.g. "{{company_logo_url}}"
    type: FieldType;
    defaultValue: string;
    isSystem: boolean;   // system variables cannot be deleted
    usageCount: number;
}

// ─── Conditional Logic ───────────────────────────────────

export type TextOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'matchesRegex';
export type NumberOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual' | 'between' | 'notBetween';
export type DateOperator = 'equals' | 'before' | 'after' | 'between' | 'isToday' | 'pastXDays' | 'nextXDays' | 'thisWeek' | 'thisMonth' | 'thisYear';
export type BooleanOperator = 'isTrue' | 'isFalse';
export type ArrayOperator = 'contains' | 'containsAnyOf' | 'containsAllOf' | 'arrayIsEmpty' | 'lengthEquals' | 'lengthGreaterThan';

export type ConditionOperator = TextOperator | NumberOperator | DateOperator | BooleanOperator | ArrayOperator;

export interface Condition {
    id: string;
    field: string;
    operator: ConditionOperator;
    value: string;
    secondValue?: string; // For "between" operators
}

export type LogicOperator = 'AND' | 'OR';

export interface ConditionalRule {
    id: string;
    name: string;
    description?: string;
    conditionType: 'single' | 'multiple' | 'custom';
    conditions: Condition[];
    logicOperator: LogicOperator;
    customExpression?: string;
    action: 'show' | 'hide';
    affectedElements: string[]; // canvas element IDs
    fallbackBehavior: 'hide' | 'alternative' | 'disable' | 'nothing';
    alternativeElements?: string[];
    priority: number;
    isEnabled: boolean;
}

// ─── Filter & Sort (for data panel) ─────────────────────

export type FilterOperator =
    | TextOperator
    | NumberOperator
    | DateOperator
    | BooleanOperator
    | ArrayOperator;

export interface DataFilter {
    id: string;
    field: string;
    operator: FilterOperator;
    value: string;
    secondValue?: string;
    logicOperator: LogicOperator; // how this connects to next filter
}

export interface DataSort {
    id: string;
    field: string;
    direction: 'asc' | 'desc';
    priority: number;
}

export interface FilterPreset {
    id: string;
    name: string;
    filters: DataFilter[];
    sorts: DataSort[];
    createdAt: string;
}

// ─── Generation & Export ─────────────────────────────────

export type ExportFormat = 'pdf' | 'jpeg' | 'png' | 'svg' | 'webp';
export type GenerationStatus = 'idle' | 'configuring' | 'generating' | 'paused' | 'completed' | 'error';

export interface GenerationConfig {
    recordSelection: 'all' | 'range' | 'filtered';
    startRecord?: number;
    endRecord?: number;
    format: ExportFormat;
    resolution: number; // DPI
    quality: number;    // 1-100 for JPEG
    filenamePattern: string; // e.g. "{first_name}_{id}"
    outputMode: 'separate' | 'multipage'; // for PDF
    includeMetadata: boolean;
    createArchive: boolean;
}

export interface GenerationProgress {
    status: GenerationStatus;
    currentRecord: number;
    totalRecords: number;
    percentage: number;
    elapsedTime: number;     // ms
    estimatedRemaining: number; // ms
    speed: number;           // records/sec
    successCount: number;
    errorCount: number;
    warningCount: number;
    errors: GenerationError[];
    generatedFiles: GeneratedFile[];
}

export interface GenerationError {
    recordIndex: number;
    field?: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface GeneratedFile {
    recordIndex: number;
    filename: string;
    size: number;
    url?: string;
    blob?: Blob;
}

// ─── Validation ──────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
    id: string;
    severity: ValidationSeverity;
    title: string;
    description: string;
    location?: string;     // element/field name
    elementId?: string;    // canvas element ID
    isAutoFixable: boolean;
    fix?: () => void;
}

// ─── Canvas Element Extensions ───────────────────────────

export interface MailMergeCanvasElement {
    elementType: 'mailmerge-field' | 'mailmerge-image' | 'mailmerge-condition';
    fieldBinding?: string;     // field name from data source
    fieldType?: FieldType;
    defaultValue?: string;
    conditionalRuleId?: string;
    isMailMerge: true;
}
