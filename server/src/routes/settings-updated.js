import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Setting } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for temporary file storage
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

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

// GET /api/settings - Get current settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get logo data from database
    const { sequelize } = await import('../models/index.js');
    
    let logoInfo = null;
    try {
      const [logoResults] = await sequelize.query(`
        SELECT filename, original_name, mimetype, size, upload_date
        FROM company_logo 
        ORDER BY upload_date DESC 
        LIMIT 1;
      `);
      
      if (logoResults.length > 0) {
        const logo = logoResults[0];
        logoInfo = {
          filename: logo.filename,
          originalName: logo.original_name,
          uploadDate: logo.upload_date,
          size: logo.size,
          mimetype: logo.mimetype
        };
      }
    } catch (error) {
      console.warn('Could not fetch logo from database:', error.message);
      
      // Fallback to old settings method
      const logoFilename = await Setting.get('logo_filename', null);
      const logoOriginalName = await Setting.get('logo_originalname', null);
      const logoUploadDate = await Setting.get('logo_uploaddate', null);
      const logoSize = await Setting.get('logo_size', null);
      const logoMimetype = await Setting.get('logo_mimetype', null);
      
      if (logoFilename) {
        logoInfo = {
          filename: logoFilename,
          originalName: logoOriginalName,
          uploadDate: logoUploadDate,
          size: logoSize ? parseInt(logoSize) : null,
          mimetype: logoMimetype
        };
      }
    }

    const lastUpdated = await Setting.get('lastUpdated', new Date().toISOString());

    const settings = {
      logo: logoInfo || {
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

// POST /api/settings/logo - Upload new logo (Database BLOB version)
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

    // Read file data as buffer
    const fileData = await fs.readFile(req.file.path);
    console.log('📖 File data read, size:', fileData.length);

    // Save to database as BLOB
    try {
      const { sequelize } = await import('../models/index.js');
      
      // Delete old logo if exists
      await sequelize.query('DELETE FROM company_logo');
      console.log('🗑️ Deleted old logo from database');

      // Insert new logo
      const [results] = await sequelize.query(`
        INSERT INTO company_logo (filename, original_name, mimetype, size, data, upload_date)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, filename, original_name, mimetype, size, upload_date;
      `, {
        bind: [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, fileData]
      });

      const newLogo = results[0];
      console.log('✅ Logo saved to database:', newLogo.id);

      // Update current_logo_id setting
      await Setting.set('current_logo_id', newLogo.id, {
        type: 'text',
        description: 'Current logo ID in company_logo table'
      });

      // Keep old settings for backward compatibility
      await Setting.set('logo_filename', req.file.filename, {
        type: 'string',
        description: 'Logo filename (legacy)'
      });

      await Setting.set('logo_originalname', req.file.originalname, {
        type: 'string',
        description: 'Logo original name (legacy)'
      });

      await Setting.set('logo_mimetype', req.file.mimetype, {
        type: 'string',
        description: 'Logo MIME type (legacy)'
      });

      await Setting.set('logo_size', req.file.size.toString(), {
        type: 'string',
        description: 'Logo file size (legacy)'
      });

      const uploadDate = new Date().toISOString();
      await Setting.set('logo_uploaddate', uploadDate, {
        type: 'string',
        description: 'Logo upload date (legacy)'
      });

      console.log('✅ Logo metadata saved to settings for compatibility');

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      console.error('❌ Database error stack:', dbError.stack);
      throw new Error('Database save failed: ' + dbError.message);
    }

    // Clean up uploaded file from filesystem
    try {
      await fs.unlink(req.file.path);
      console.log('🗑️ Deleted temporary file:', req.file.path);
    } catch (error) {
      console.warn('⚠️ Could not delete temporary file:', error.message);
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

    res.status(500).json({ 
      message: 'Error uploading logo',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/settings/logo/:filename - Serve logo from database
router.get('/logo/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    console.log('📁 Logo request for:', filename);

    const { sequelize } = await import('../models/index.js');
    
    // Get logo from database
    const [logoResults] = await sequelize.query(`
      SELECT filename, original_name, mimetype, size, data, upload_date
      FROM company_logo 
      WHERE filename = $1
      ORDER BY upload_date DESC 
      LIMIT 1;
    `, {
      bind: [filename]
    });

    if (logoResults.length === 0) {
      console.log('❌ Logo not found in database:', filename);
      
      // Return default logo
      const defaultLogo = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="80" fill="url(#goldGradient)" rx="10"/>
        <text x="100" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2C3E50" text-anchor="middle">Golden Horse</text>
        <text x="100" y="50" font-family="Arial, sans-serif" font-size="12" fill="#34495E" text-anchor="middle">Shipping Services</text>
        <text x="100" y="65" font-family="Arial, sans-serif" font-size="8" fill="#7F8C8D" text-anchor="middle">خدمات الشحن الذهبية</text>
      </svg>`;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(defaultLogo);
    }

    const logo = logoResults[0];
    console.log('✅ Logo found in database:', logo.filename);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

    // Set appropriate headers
    res.setHeader('Content-Type', logo.mimetype);
    res.setHeader('Content-Length', logo.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Last-Modified', new Date(logo.upload_date).toUTCString());

    // Send the logo data
    res.send(logo.data);

  } catch (error) {
    console.error('❌ Error serving logo:', error);
    res.status(500).json({ message: 'Error serving logo' });
  }
});

// GET /api/settings/logo - Serve current logo from database
router.get('/logo', async (req, res) => {
  try {
    console.log('📁 Current logo request');

    const { sequelize } = await import('../models/index.js');
    
    // Get current logo from database
    const [logoResults] = await sequelize.query(`
      SELECT filename, original_name, mimetype, size, data, upload_date
      FROM company_logo 
      ORDER BY upload_date DESC 
      LIMIT 1;
    `);

    if (logoResults.length === 0) {
      console.log('❌ No logo found in database');
      
      // Return default logo
      const defaultLogo = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="80" fill="url(#goldGradient)" rx="10"/>
        <text x="100" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2C3E50" text-anchor="middle">Golden Horse</text>
        <text x="100" y="50" font-family="Arial, sans-serif" font-size="12" fill="#34495E" text-anchor="middle">Shipping Services</text>
        <text x="100" y="65" font-family="Arial, sans-serif" font-size="8" fill="#7F8C8D" text-anchor="middle">خدمات الشحن الذهبية</text>
      </svg>`;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(defaultLogo);
    }

    const logo = logoResults[0];
    console.log('✅ Current logo found:', logo.filename);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

    // Set appropriate headers
    res.setHeader('Content-Type', logo.mimetype);
    res.setHeader('Content-Length', logo.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Last-Modified', new Date(logo.upload_date).toUTCString());

    // Send the logo data
    res.send(logo.data);

  } catch (error) {
    console.error('❌ Error serving current logo:', error);
    res.status(500).json({ message: 'Error serving logo' });
  }
});

export default router;
