import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile } from 'express-fileupload';

const router = express.Router();

interface Asset {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: Date;
}

// Upload assets
router.post('/upload', async (req: Request, res: Response) => {
    try {
        if (!req.files || !req.files.files) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Normalize type to plural form for consistency
        const typeMap: Record<string, string> = {
            'logo': 'logos',
            'signature': 'signatures',
            'background': 'backgrounds',
            'image': 'images',
            'images': 'images'
        };

        const rawType = req.body.type || 'images';
        const type = typeMap[rawType] || 'images';

        const uploadPath = path.join(__dirname, `../../storage/assets/${type}`);

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Handle single or multiple files
        const uploadedFiles = Array.isArray(req.files.files)
            ? req.files.files
            : [req.files.files];

        const assets: Asset[] = [];

        for (const file of uploadedFiles as UploadedFile[]) {
            const uniqueName = `${uuidv4()}${path.extname(file.name)}`;
            const filePath = path.join(uploadPath, uniqueName);

            await file.mv(filePath);

            assets.push({
                id: path.parse(uniqueName).name,
                name: file.name,
                type: type,
                url: `/storage/assets/${type}/${uniqueName}`,
                size: file.size,
                uploadedAt: new Date(),
            });
        }

        // Save asset metadata to JSON file
        const metadataPath = path.join(uploadPath, 'metadata.json');

        let metadata: Asset[] = [];
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        }

        metadata.push(...assets);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        res.json({ success: true, assets });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload assets' });
    }
});

// Get all assets
router.get('/', (req: Request, res: Response) => {
    try {
        const assetTypes = ['logos', 'signatures', 'backgrounds', 'images'];
        const allAssets: Asset[] = [];

        assetTypes.forEach(type => {
            const metadataPath = path.join(
                __dirname,
                `../../storage/assets/${type}/metadata.json`
            );

            if (fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
                allAssets.push(...metadata);
            }
        });

        res.json(allAssets);
    } catch (error) {
        console.error('Get assets error:', error);
        res.status(500).json({ error: 'Failed to get assets' });
    }
});

// Get assets by type
router.get('/type/:type', (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const metadataPath = path.join(
            __dirname,
            `../../storage/assets/${type}/metadata.json`
        );

        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            res.json(metadata);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Get assets by type error:', error);
        res.status(500).json({ error: 'Failed to get assets' });
    }
});

// Delete asset
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assetTypes = ['logos', 'signatures', 'backgrounds', 'images'];

        let deleted = false;

        assetTypes.forEach(type => {
            const metadataPath = path.join(
                __dirname,
                `../../storage/assets/${type}/metadata.json`
            );

            if (fs.existsSync(metadataPath)) {
                let metadata: Asset[] = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
                const asset = metadata.find(a => a.id === id);

                if (asset) {
                    // Delete file
                    const filePath = path.join(__dirname, '../..', asset.url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    // Remove from metadata
                    metadata = metadata.filter(a => a.id !== id);
                    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

                    deleted = true;
                }
            }
        });

        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Asset not found' });
        }
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});

// Rename asset
router.put('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const assetTypes = ['logos', 'signatures', 'backgrounds', 'images'];

        let updated = false;

        assetTypes.forEach(type => {
            const metadataPath = path.join(
                __dirname,
                `../../storage/assets/${type}/metadata.json`
            );

            if (fs.existsSync(metadataPath)) {
                const metadata: Asset[] = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
                const assetIndex = metadata.findIndex(a => a.id === id);

                if (assetIndex !== -1) {
                    metadata[assetIndex].name = name;
                    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
                    updated = true;
                }
            }
        });

        if (updated) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Asset not found' });
        }
    } catch (error) {
        console.error('Rename asset error:', error);
        res.status(500).json({ error: 'Failed to rename asset' });
    }
});

export default router;
