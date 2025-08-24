import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// File filter for logo uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and SVG files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Settings data file path
const settingsFile = path.join(__dirname, '../data/settings.json');

// Initialize settings file if it doesn't exist
const initializeSettings = async () => {
  try {
    await fs.access(settingsFile);
  } catch (error) {
    // File doesn't exist, create it with default settings
    const defaultSettings = {
      logo: {
        filename: null,
        originalName: null,
        uploadDate: null,
        size: null,
        mimetype: null
      },
      lastUpdated: new Date().toISOString()
    };

    // Ensure the data directory exists
    const dataDir = path.dirname(settingsFile);
    if (!fsSync.existsSync(dataDir)) {
      fsSync.mkdirSync(dataDir, { recursive: true });
    }
    await fs.writeFile(settingsFile, JSON.stringify(defaultSettings, null, 2));
  }
};

// Helper function to read settings
const readSettings = async () => {
  await initializeSettings();
  const data = await fs.readFile(settingsFile, 'utf8');
  return JSON.parse(data);
};

// Helper function to write settings
const writeSettings = async (settings) => {
  settings.lastUpdated = new Date().toISOString();
  await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
};

// GET /api/settings - Get current settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    // Return default settings instead of error
    const defaultSettings = {
      logo: {
        filename: null,
        originalName: null,
        uploadDate: null,
        size: null,
        mimetype: null
      },
      lastUpdated: new Date().toISOString()
    };
    res.json(defaultSettings);
  }
});

// POST /api/settings/logo - Upload new logo
router.post('/logo', authenticateToken, requireRole(['admin']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const settings = await readSettings();

    // Delete old logo file if it exists
    if (settings.logo.filename) {
      const oldLogoPath = path.join(uploadsDir, settings.logo.filename);
      try {
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.warn('Could not delete old logo file:', error.message);
      }
    }

    // Update settings with new logo info
    settings.logo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date().toISOString(),
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    await writeSettings(settings);

    res.json({
      message: 'Logo uploaded successfully',
      logo: settings.logo
    });
  } catch (error) {
    console.error('Error uploading logo:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not clean up uploaded file:', cleanupError.message);
      }
    }

    if (error.message.includes('Invalid file type')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  }
});

// GET/HEAD /api/settings/logo - Get current logo file
router.get('/logo', async (req, res) => {
  try {
    const settings = await readSettings();

    if (!settings.logo.filename) {
      return res.status(404).json({ message: 'No logo uploaded' });
    }

    const logoPath = path.join(uploadsDir, settings.logo.filename);

    // Check if file exists
    try {
      await fs.access(logoPath);
    } catch (error) {
      return res.status(404).json({ message: 'Logo file not found' });
    }

    // Set appropriate content type
    res.setHeader('Content-Type', settings.logo.mimetype || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // For HEAD requests, just send headers without body
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.sendFile(logoPath);
    }
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(500).json({ message: 'Failed to serve logo' });
  }
});

// DELETE /api/settings/logo - Delete current logo
router.delete('/logo', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const settings = await readSettings();

    if (!settings.logo.filename) {
      return res.status(404).json({ message: 'No logo to delete' });
    }

    // Delete logo file
    const logoPath = path.join(uploadsDir, settings.logo.filename);
    try {
      await fs.unlink(logoPath);
    } catch (error) {
      console.warn('Could not delete logo file:', error.message);
    }

    // Reset logo settings
    settings.logo = {
      filename: null,
      originalName: null,
      uploadDate: null,
      size: null,
      mimetype: null
    };

    await writeSettings(settings);

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Failed to delete logo' });
  }
});

// HEAD /api/settings/logo - Check if logo exists
router.head('/logo', async (req, res) => {
  try {
    const settings = await readSettings();

    if (!settings.logo.filename) {
      return res.status(404).end();
    }

    const logoPath = path.join(uploadsDir, settings.logo.filename);

    // Check if file exists
    try {
      await fs.access(logoPath);
    } catch (error) {
      return res.status(404).end();
    }

    // Set appropriate headers
    res.setHeader('Content-Type', settings.logo.mimetype || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.end();
  } catch (error) {
    console.error('Error checking logo:', error);
    res.status(500).end();
  }
});

export default router;
