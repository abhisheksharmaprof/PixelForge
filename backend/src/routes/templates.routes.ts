import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_PATHS } from '../config/fileSystem';

const router = express.Router();

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    data: any;
    createdAt: string;
    updatedAt: string;
    tags: string[];
}

// Get all templates
router.get('/', (req: Request, res: Response) => {
    try {
        const templates: Template[] = [];
        const categories = Object.keys(STORAGE_PATHS.TEMPLATES).filter(k => k !== 'ROOT');

        // Helper to check directory and read files
        const readTemplatesFromDir = (dirPath: string, category: string) => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                files.forEach(file => {
                    if (path.extname(file) === '.json') {
                        try {
                            const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
                            const template = JSON.parse(content);
                            templates.push(template);
                        } catch (err) {
                            console.error(`Failed to parse template ${file}:`, err);
                        }
                    }
                });
            }
        };

        // Read specific categories defined in STORAGE_PATHS
        categories.forEach(key => {
            const dirPath = (STORAGE_PATHS.TEMPLATES as any)[key];
            readTemplatesFromDir(dirPath, key);
        });

        // Also check root templates folder for any unorganized ones (optional, or 'Custom')
        readTemplatesFromDir(STORAGE_PATHS.TEMPLATES.ROOT, 'Uncategorized');

        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to get templates' });
    }
});

// Get template by ID
router.get('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Search in all category folders
        const categories = Object.keys(STORAGE_PATHS.TEMPLATES).filter(k => k !== 'ROOT');
        let foundTemplate: Template | null = null;

        const searchDir = (dirPath: string) => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                const file = files.find(f => {
                    if (path.extname(f) !== '.json') return false;
                    try {
                        const content = fs.readFileSync(path.join(dirPath, f), 'utf-8');
                        const json = JSON.parse(content);
                        return json.id === id;
                    } catch { return false; }
                });

                if (file) {
                    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
                    foundTemplate = JSON.parse(content);
                    return true;
                }
            }
            return false;
        };

        for (const key of categories) {
            if (searchDir((STORAGE_PATHS.TEMPLATES as any)[key])) break;
        }

        if (!foundTemplate) {
            searchDir(STORAGE_PATHS.TEMPLATES.ROOT);
        }

        if (foundTemplate) {
            res.json(foundTemplate);
        } else {
            res.status(404).json({ error: 'Template not found' });
        }

    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Failed to get template' });
    }
});

// Create new template
router.post('/', (req: Request, res: Response) => {
    try {
        const template: Template = req.body;

        if (!template.name) {
            return res.status(400).json({ error: 'Template name is required' });
        }

        // Generate ID if missing
        if (!template.id) {
            template.id = uuidv4();
        }

        template.createdAt = new Date().toISOString();
        template.updatedAt = new Date().toISOString();

        // Determine category folder
        let categoryPath = STORAGE_PATHS.TEMPLATES.CUSTOM; // Default
        const normalizedCategory = template.category ? template.category.toUpperCase().replace(/\s+/g, '_') : 'CUSTOM';

        if ((STORAGE_PATHS.TEMPLATES as any)[normalizedCategory]) {
            categoryPath = (STORAGE_PATHS.TEMPLATES as any)[normalizedCategory];
        } else {
            // Map common names to keys if needed, or just use Custom
            if (template.category === 'Certificate') categoryPath = STORAGE_PATHS.TEMPLATES.CERTIFICATES;
            else if (template.category === 'ID Card') categoryPath = STORAGE_PATHS.TEMPLATES.ID_CARDS;
            else if (template.category === 'Poster') categoryPath = STORAGE_PATHS.TEMPLATES.POSTERS;
            else if (template.category === 'Marksheet') categoryPath = STORAGE_PATHS.TEMPLATES.MARKSHEETS;
        }

        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        const filePath = path.join(categoryPath, `${template.name.replace(/[^a-z0-9]/gi, '_')}_${template.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(template, null, 2));

        res.json(template);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
router.put('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Find existing file to delete (key implementation detail: we might need to move it if name/category changes, but for now just overwrite content)
        // Ideally we should find the file first.

        let existingFilePath: string | null = null;
        const categories = Object.keys(STORAGE_PATHS.TEMPLATES).filter(k => k !== 'ROOT');

        const findFile = (dirPath: string) => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    if (path.extname(file) === '.json') {
                        try {
                            const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
                            const json = JSON.parse(content);
                            if (json.id === id) return path.join(dirPath, file);
                        } catch { }
                    }
                }
            }
            return null;
        };

        for (const key of categories) {
            existingFilePath = findFile((STORAGE_PATHS.TEMPLATES as any)[key]);
            if (existingFilePath) break;
        }
        if (!existingFilePath) existingFilePath = findFile(STORAGE_PATHS.TEMPLATES.ROOT);

        if (existingFilePath) {
            // Read existing to merge or just overwrite? properties.
            // For simplicity, we overwrite with merged data from frontend

            const existingContent = JSON.parse(fs.readFileSync(existingFilePath, 'utf-8'));
            const updatedTemplate = { ...existingContent, ...updates, updatedAt: new Date().toISOString() };

            fs.writeFileSync(existingFilePath, JSON.stringify(updatedTemplate, null, 2));
            res.json(updatedTemplate);
        } else {
            res.status(404).json({ error: 'Template not found to update' });
        }

    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let existingFilePath: string | null = null;
        const categories = Object.keys(STORAGE_PATHS.TEMPLATES).filter(k => k !== 'ROOT');

        const findFile = (dirPath: string) => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    if (path.extname(file) === '.json') {
                        try {
                            const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
                            const json = JSON.parse(content);
                            if (json.id === id) return path.join(dirPath, file);
                        } catch { }
                    }
                }
            }
            return null;
        };

        for (const key of categories) {
            existingFilePath = findFile((STORAGE_PATHS.TEMPLATES as any)[key]);
            if (existingFilePath) break;
        }
        if (!existingFilePath) existingFilePath = findFile(STORAGE_PATHS.TEMPLATES.ROOT);

        if (existingFilePath) {
            fs.unlinkSync(existingFilePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Template not found' });
        }

    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
