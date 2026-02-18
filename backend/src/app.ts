import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import { initializeStorage } from './config/fileSystem';
import templatesRoutes from './routes/templates.routes';
import dataRoutes from './routes/data.routes';
import generateRoutes from './routes/generate.routes';
import assetsRoutes from './routes/assets.routes';
import filesRoutes from './routes/files.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3006',
        'http://localhost:5173',
        'http://localhost:5174', // Vite fallback
        'http://localhost:3000'
    ],
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    useTempFiles: true,
    tempFileDir: './storage/temp/',
}));

// Static file serving
app.use('/storage', express.static('storage'));

// Routes
app.use('/api/templates', templatesRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/files', filesRoutes);

// Initialize storage on startup
initializeStorage();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
