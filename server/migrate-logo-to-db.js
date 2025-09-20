import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import models from './src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrateLogo = async () => {
  try {
    console.log('🔄 Starting logo migration to database...');

    // Check if settings.json exists
    const settingsFile = path.join(__dirname, 'src/data/settings.json');
    let settingsData = null;
    
    try {
      const data = await fs.readFile(settingsFile, 'utf8');
      settingsData = JSON.parse(data);
      console.log('📄 Found settings.json file');
    } catch (error) {
      console.log('📄 No settings.json file found, checking database...');
    }

    // Check if logo already exists in database
    const existingLogo = await models.Setting.get('logo', null);
    if (existingLogo && existingLogo.data) {
      console.log('✅ Logo already exists in database, no migration needed');
      return;
    }

    // If we have settings data and logo info
    if (settingsData && settingsData.logo && settingsData.logo.filename) {
      const logoPath = path.join(__dirname, 'uploads', settingsData.logo.filename);
      
      try {
        // Check if logo file exists
        await fs.access(logoPath);
        console.log(`📁 Found logo file: ${settingsData.logo.filename}`);

        // Read the logo file
        const fileBuffer = await fs.readFile(logoPath);
        const base64Data = fileBuffer.toString('base64');

        // Store in database
        const logoData = {
          filename: settingsData.logo.filename,
          originalName: settingsData.logo.originalName,
          uploadDate: settingsData.logo.uploadDate,
          size: settingsData.logo.size,
          mimetype: settingsData.logo.mimetype,
          data: base64Data
        };

        await models.Setting.set('logo', logoData, {
          type: 'json',
          description: 'Company logo data'
        });

        // Update last updated timestamp
        await models.Setting.set('lastUpdated', settingsData.lastUpdated || new Date().toISOString(), {
          type: 'string',
          description: 'Last system update'
        });

        console.log('✅ Logo successfully migrated to database');
        console.log(`📊 Logo size: ${Math.round(settingsData.logo.size / 1024)} KB`);
        console.log(`🎨 Logo type: ${settingsData.logo.mimetype}`);

        // Clean up old file (optional)
        try {
          await fs.unlink(logoPath);
          console.log('🗑️ Cleaned up old logo file');
        } catch (error) {
          console.log('⚠️ Could not delete old logo file:', error.message);
        }

      } catch (error) {
        console.log('❌ Logo file not found:', logoPath);
        console.log('⚠️ Settings reference a logo file that doesn\'t exist');
      }
    } else {
      console.log('📄 No logo data found in settings.json');
    }

    console.log('✅ Logo migration completed');

  } catch (error) {
    console.error('❌ Error during logo migration:', error);
    process.exit(1);
  }
};

// Run migration
migrateLogo().then(() => {
  console.log('🎉 Migration finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
