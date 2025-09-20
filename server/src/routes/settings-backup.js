import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import models from '../models/index.js';

const { Setting } = models;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create uploads directory in a persistent location
// Use /app/data for persistent storage in Docker
const uploadsDir = process.env.NODE_ENV === 'production'
  ? path.join('/app', 'data', 'uploads')
  : path.join(__dirname, '../../uploads');

if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
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

// Helper function to read settings from database
const readSettings = async () => {
  try {
    const logoFilename = await Setting.get('logo_filename', null);
    const logoOriginalName = await Setting.get('logo_originalname', null);
    const logoUploadDate = await Setting.get('logo_uploaddate', null);
    const logoSize = await Setting.get('logo_size', null);
    const logoMimetype = await Setting.get('logo_mimetype', null);
    const lastUpdated = await Setting.get('lastUpdated', new Date().toISOString());

    return {
      logo: logoFilename ? {
        filename: logoFilename,
        originalName: logoOriginalName,
        uploadDate: logoUploadDate,
        size: logoSize ? parseInt(logoSize) : null,
        mimetype: logoMimetype
      } : {
        filename: null,
        originalName: null,
        uploadDate: null,
        size: null,
        mimetype: null
      },
      lastUpdated: lastUpdated
    };
  } catch (error) {
    console.error('Error reading settings from database:', error);
    // Return default settings if database read fails
    return {
      logo: {
        filename: null,
        originalName: null,
        uploadDate: null,
        size: null,
        mimetype: null
      },
      lastUpdated: new Date().toISOString()
    };
  }
};

// Helper function to write settings to database
const writeSettings = async (settings) => {
  try {
    if (settings.logo) {
      await Setting.set('logo_filename', settings.logo.filename || null);
      await Setting.set('logo_originalname', settings.logo.originalName || null);
      await Setting.set('logo_uploaddate', settings.logo.uploadDate || null);
      await Setting.set('logo_size', settings.logo.size ? settings.logo.size.toString() : null);
      await Setting.set('logo_mimetype', settings.logo.mimetype || null);
    }

    await Setting.set('lastUpdated', new Date().toISOString());

    console.log('✅ Settings saved to database successfully');
  } catch (error) {
    console.error('❌ Error saving settings to database:', error);
    throw error;
  }
};

// GET /api/settings - Get current settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get logo data from separate fields
    const logoFilename = await Setting.get('logo_filename', null);
    const logoOriginalName = await Setting.get('logo_originalname', null);
    const logoUploadDate = await Setting.get('logo_uploaddate', null);
    const logoSize = await Setting.get('logo_size', null);
    const logoMimetype = await Setting.get('logo_mimetype', null);
    const lastUpdated = await Setting.get('lastUpdated', new Date().toISOString());

    const settings = {
      logo: logoFilename ? {
        filename: logoFilename,
        originalName: logoOriginalName,
        uploadDate: logoUploadDate,
        size: logoSize ? parseInt(logoSize) : null,
        mimetype: logoMimetype
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

// POST /api/settings/logo - Upload new logo (Simplified version)
router.post('/logo', authenticateToken, requireRole(['admin']), upload.single('logo'), async (req, res) => {
  try {
    console.log('📤 Logo upload started');

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📁 File info:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });

    // Simple approach: just store metadata, keep file in original location
    console.log('💾 Preparing logo metadata for database...');
    const logoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date().toISOString(),
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    console.log('💾 Saving logo metadata to database...');
    console.log('💾 Logo data to save:', logoData);

    // Try to save to database - save each field separately
    try {
      console.log('💾 Saving logo_filename:', req.file.filename);
      await Setting.set('logo_filename', req.file.filename, {
        type: 'string',
        description: 'Logo filename'
      });

      console.log('💾 Saving logo_originalname:', req.file.originalname);
      await Setting.set('logo_originalname', req.file.originalname, {
        type: 'string',
        description: 'Logo original name'
      });

      console.log('💾 Saving logo_mimetype:', req.file.mimetype);
      await Setting.set('logo_mimetype', req.file.mimetype, {
        type: 'string',
        description: 'Logo MIME type'
      });

      console.log('💾 Saving logo_size:', req.file.size.toString());
      await Setting.set('logo_size', req.file.size.toString(), {
        type: 'string',
        description: 'Logo file size'
      });

      const uploadDate = new Date().toISOString();
      console.log('💾 Saving logo_uploaddate:', uploadDate);
      await Setting.set('logo_uploaddate', uploadDate, {
        type: 'string',
        description: 'Logo upload date'
      });

      console.log('✅ Logo metadata saved to database successfully');

    // Clean up old logo file if it exists
    const oldLogoFilename = await Setting.get('logo_filename', null);
    if (oldLogoFilename && oldLogoFilename !== req.file.filename) {
      const oldLogoPath = path.join(uploadsDir, oldLogoFilename);
      try {
        await fs.unlink(oldLogoPath);
        console.log('🗑️ Deleted old logo file:', oldLogoPath);
      } catch (error) {
        console.warn('⚠️ Could not delete old logo file:', error.message);
      }
    }

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      console.error('❌ Database error stack:', dbError.stack);
      throw new Error('Database save failed: ' + dbError.message);
    }

    res.json({
      message: 'Logo uploaded successfully',
      logo: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadDate: new Date().toISOString(),
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });

    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log('🗑️ Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up uploaded file:', cleanupError.message);
      }
    }

    if (error.message.includes('Invalid file type')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message: 'Failed to upload logo',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// GET/HEAD /api/settings/logo - Get current logo file
router.get('/logo', async (req, res) => {
  try {
    console.log('🔍 Getting logo...');

    // Get logo metadata from database
    const filename = await Setting.get('logo_filename', null);
    const mimetype = await Setting.get('logo_mimetype', null);

    console.log('📄 Logo metadata:', { filename, mimetype });

    if (!filename) {
      console.log('❌ No logo filename found - returning default logo');
      // Return a simple SVG logo as default
      const defaultLogo = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#D4AF37"/>
        <text x="50" y="55" font-family="Arial" font-size="14" fill="white" text-anchor="middle">LOGO</text>
      </svg>`;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(defaultLogo);
    }

    // Get logo file path
    const logoPath = path.join(uploadsDir, filename);
    console.log('📁 Logo path:', logoPath);

    // Check if file exists
    try {
      await fs.access(logoPath);
      console.log('✅ Logo file found');
    } catch (error) {
      console.error('❌ Logo file not found:', logoPath);
      return res.status(404).json({ message: 'Logo file not found' });
    }

    // Set CORS headers explicitly for image files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Disposition');

    // Set appropriate content type
    res.setHeader('Content-Type', mimetype || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // For HEAD requests, just send headers without body
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.sendFile(logoPath);
    }
  } catch (error) {
    console.error('❌ Error serving logo:', error);
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
    const logoDataStr = await Setting.get('logo', null);

    let logoData = null;
    if (logoDataStr) {
      try {
        logoData = typeof logoDataStr === 'string' ? JSON.parse(logoDataStr) : logoDataStr;
      } catch (e) {
        console.error('Error parsing logo data:', e);
      }
    }

    if (!logoData || !logoData.filename) {
      return res.status(404).json({ message: 'No logo to delete' });
    }

    // Delete logo from database
    await Setting.set('logo', null, {
      type: 'json',
      description: 'Company logo data'
    });

    // Update last updated timestamp
    await Setting.set('lastUpdated', new Date().toISOString(), {
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
    const logoDataStr = await Setting.get('logo', null);

    let logoData = null;
    if (logoDataStr) {
      try {
        logoData = typeof logoDataStr === 'string' ? JSON.parse(logoDataStr) : logoDataStr;
      } catch (e) {
        console.error('Error parsing logo data:', e);
        return res.status(404).end();
      }
    }

    if (!logoData || !logoData.filename) {
      return res.status(404).end();
    }

    // Check if file exists
    const logoPath = logoData.path || path.join(uploadsDir, logoData.filename);
    try {
      await fs.access(logoPath);
    } catch (error) {
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
