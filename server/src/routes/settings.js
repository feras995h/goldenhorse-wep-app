import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import models from '../models/index.js';

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
    const logoData = await models.Setting.get('logo', null);
    const lastUpdated = await models.Setting.get('lastUpdated', new Date().toISOString());

    const settings = {
      logo: logoData ? {
        filename: logoData.filename || null,
        originalName: logoData.originalName || null,
        uploadDate: logoData.uploadDate || null,
        size: logoData.size || null,
        mimetype: logoData.mimetype || null
      } : {
        filename: null,
        originalName: null,
        uploadDate: null,
        size: null,
        mimetype: null
      },
      lastUpdated: lastUpdated
    };

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

    // Convert file to base64 for database storage
    const fileBuffer = await fs.readFile(req.file.path);
    const base64Data = fileBuffer.toString('base64');

    // Get old logo data to clean up
    const oldLogoData = await models.Setting.get('logo', {});

    // Store logo data in database
    const logoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date().toISOString(),
      size: req.file.size,
      mimetype: req.file.mimetype,
      data: base64Data
    };

    await models.Setting.set('logo', logoData, {
      type: 'json',
      description: 'Company logo data'
    });

    // Clean up uploaded file (we don't need it anymore)
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      console.warn('Could not delete temporary file:', error.message);
    }

    // Clean up old logo file if it exists
    if (oldLogoData && oldLogoData.filename) {
      const oldLogoPath = path.join(uploadsDir, oldLogoData.filename);
      try {
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.warn('Could not delete old logo file:', error.message);
      }
    }

    res.json({
      message: 'Logo uploaded successfully',
      logo: {
        filename: logoData.filename,
        originalName: logoData.originalName,
        uploadDate: logoData.uploadDate,
        size: logoData.size,
        mimetype: logoData.mimetype
      }
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
    const logoData = await models.Setting.get('logo', null);

    if (!logoData || !logoData.data) {
      return res.status(404).json({ message: 'No logo uploaded' });
    }

    // Convert base64 back to buffer
    const imageBuffer = Buffer.from(logoData.data, 'base64');

    // Set CORS headers explicitly for image files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Disposition');

    // Set appropriate content type
    res.setHeader('Content-Type', logoData.mimetype || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Length', imageBuffer.length);

    // For HEAD requests, just send headers without body
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.send(imageBuffer);
    }
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(500).json({ message: 'Failed to serve logo' });
  }
});

// OPTIONS /api/settings/logo - Handle preflight requests
router.options('/logo', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// DELETE /api/settings/logo - Delete current logo
router.delete('/logo', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const logoData = await models.Setting.get('logo', null);

    if (!logoData || !logoData.filename) {
      return res.status(404).json({ message: 'No logo to delete' });
    }

    // Delete logo from database
    await models.Setting.set('logo', null, {
      type: 'json',
      description: 'Company logo data'
    });

    // Update last updated timestamp
    await models.Setting.set('lastUpdated', new Date().toISOString(), {
      type: 'string',
      description: 'Last system update'
    });

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Failed to delete logo' });
  }
});

// HEAD /api/settings/logo - Check if logo exists
router.head('/logo', async (req, res) => {
  try {
    const logoData = await models.Setting.get('logo', null);

    if (!logoData || !logoData.data) {
      return res.status(404).end();
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

    // Set appropriate headers
    res.setHeader('Content-Type', logoData.mimetype || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.end();
  } catch (error) {
    console.error('Error checking logo:', error);
    res.status(500).end();
  }
});

export default router;
