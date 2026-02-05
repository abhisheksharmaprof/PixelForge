import path from 'path';
import fs from 'fs';

const STORAGE_ROOT = path.join(__dirname, '../../storage');

export const STORAGE_PATHS = {
    TEMPLATES: {
        ROOT: path.join(STORAGE_ROOT, 'templates'),
        CERTIFICATES: path.join(STORAGE_ROOT, 'templates/Certificates'),
        MARKSHEETS: path.join(STORAGE_ROOT, 'templates/Marksheets'),
        POSTERS: path.join(STORAGE_ROOT, 'templates/Posters'),
        ID_CARDS: path.join(STORAGE_ROOT, 'templates/IDCards'),
        CUSTOM: path.join(STORAGE_ROOT, 'templates/Custom'),
    },
    ASSETS: {
        ROOT: path.join(STORAGE_ROOT, 'assets'),
        LOGOS: path.join(STORAGE_ROOT, 'assets/logos'),
        SIGNATURES: path.join(STORAGE_ROOT, 'assets/signatures'),
        BACKGROUNDS: path.join(STORAGE_ROOT, 'assets/backgrounds'),
        IMAGES: path.join(STORAGE_ROOT, 'assets/images'),
    },
    DATA: path.join(STORAGE_ROOT, 'data/excel-files'),
    GENERATED: path.join(STORAGE_ROOT, 'generated'),
    TEMP: path.join(STORAGE_ROOT, 'temp'),
};

// Initialize storage structure
export async function initializeStorage() {
    const allPaths = [
        ...Object.values(STORAGE_PATHS.TEMPLATES),
        ...Object.values(STORAGE_PATHS.ASSETS),
        STORAGE_PATHS.DATA,
        STORAGE_PATHS.GENERATED,
        STORAGE_PATHS.TEMP,
    ];

    for (const dirPath of allPaths) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}
