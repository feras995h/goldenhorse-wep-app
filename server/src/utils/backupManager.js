import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import cron from 'node-cron';
import { sequelize } from '../models/index.js';

const execAsync = promisify(exec);

/**
 * Backup Manager for Database and Files
 * Handles automated backups, restoration, and cleanup
 */
class BackupManager {
  
  constructor() {
    this.backupPath = process.env.BACKUP_PATH || './backups';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.isInitialized = false;
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      // Create backup directory
      await fs.ensureDir(this.backupPath);
      
      // Schedule automatic backups
      this.scheduleBackups();
      
      this.isInitialized = true;
      console.log('✅ Backup Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Backup Manager:', error.message);
      throw error;
    }
  }

  /**
   * Create database backup
   * @param {string} backupName - Optional backup name
   * @returns {Promise<Object>} Backup result
   */
  async createDatabaseBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = backupName || `db_backup_${timestamp}.sql`;
      const backupFile = path.join(this.backupPath, filename);

      console.log('🔄 Creating database backup...');

      // Get database configuration
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
      };

      // Create pg_dump command
      const dumpCommand = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -f "${backupFile}" --verbose --clean --if-exists --create`;

      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: config.password };

      // Execute backup
      const { stdout, stderr } = await execAsync(dumpCommand, { env });

      // Check if backup file was created
      const stats = await fs.stat(backupFile);
      
      console.log('✅ Database backup created successfully');
      
      return {
        success: true,
        filename,
        path: backupFile,
        size: stats.size,
        timestamp: new Date().toISOString(),
        type: 'database'
      };

    } catch (error) {
      console.error('❌ Database backup failed:', error.message);
      throw {
        success: false,
        error: error.message,
        type: 'database_backup_failed'
      };
    }
  }

  /**
   * Create files backup (uploads, logs, etc.)
   * @param {string} backupName - Optional backup name
   * @returns {Promise<Object>} Backup result
   */
  async createFilesBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = backupName || `files_backup_${timestamp}.tar.gz`;
      const backupFile = path.join(this.backupPath, filename);

      console.log('🔄 Creating files backup...');

      // Directories to backup
      const dirsToBackup = [
        './uploads',
        './logs',
        './.env',
        './package.json',
        './package-lock.json'
      ].filter(dir => fs.existsSync(dir));

      if (dirsToBackup.length === 0) {
        throw new Error('No files to backup');
      }

      // Create tar command
      const tarCommand = `tar -czf "${backupFile}" ${dirsToBackup.join(' ')}`;

      // Execute backup
      await execAsync(tarCommand);

      // Check if backup file was created
      const stats = await fs.stat(backupFile);
      
      console.log('✅ Files backup created successfully');
      
      return {
        success: true,
        filename,
        path: backupFile,
        size: stats.size,
        timestamp: new Date().toISOString(),
        type: 'files',
        includedDirs: dirsToBackup
      };

    } catch (error) {
      console.error('❌ Files backup failed:', error.message);
      throw {
        success: false,
        error: error.message,
        type: 'files_backup_failed'
      };
    }
  }

  /**
   * Create complete backup (database + files)
   * @param {string} backupName - Optional backup name prefix
   * @returns {Promise<Object>} Backup result
   */
  async createCompleteBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const prefix = backupName || `complete_backup_${timestamp}`;

      console.log('🔄 Creating complete backup...');

      // Create both backups
      const [dbBackup, filesBackup] = await Promise.all([
        this.createDatabaseBackup(`${prefix}_db.sql`),
        this.createFilesBackup(`${prefix}_files.tar.gz`)
      ]);

      console.log('✅ Complete backup created successfully');

      return {
        success: true,
        timestamp: new Date().toISOString(),
        database: dbBackup,
        files: filesBackup,
        totalSize: dbBackup.size + filesBackup.size
      };

    } catch (error) {
      console.error('❌ Complete backup failed:', error.message);
      throw {
        success: false,
        error: error.message,
        type: 'complete_backup_failed'
      };
    }
  }

  /**
   * List available backups
   * @returns {Promise<Array>} List of backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: this.getBackupType(file)
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);

      return backups;

    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      throw error;
    }
  }

  /**
   * Delete old backups based on retention policy
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const toDelete = backups.filter(backup => backup.created < cutoffDate);
      
      if (toDelete.length === 0) {
        console.log('✅ No old backups to cleanup');
        return { deleted: 0, kept: backups.length };
      }

      console.log(`🗑️ Cleaning up ${toDelete.length} old backups...`);

      for (const backup of toDelete) {
        await fs.remove(backup.path);
        console.log(`🗑️ Deleted old backup: ${backup.filename}`);
      }

      console.log(`✅ Cleanup completed: ${toDelete.length} deleted, ${backups.length - toDelete.length} kept`);

      return {
        deleted: toDelete.length,
        kept: backups.length - toDelete.length,
        deletedFiles: toDelete.map(b => b.filename)
      };

    } catch (error) {
      console.error('❌ Backup cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleBackups() {
    // Daily backup at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🕐 Starting scheduled backup...');
        await this.createCompleteBackup();
        await this.cleanupOldBackups();
        console.log('✅ Scheduled backup completed');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      }
    });

    // Weekly cleanup on Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
      try {
        console.log('🧹 Starting weekly cleanup...');
        await this.cleanupOldBackups();
        console.log('✅ Weekly cleanup completed');
      } catch (error) {
        console.error('❌ Weekly cleanup failed:', error.message);
      }
    });

    console.log('⏰ Backup schedules configured:');
    console.log('   - Daily backup: 2:00 AM');
    console.log('   - Weekly cleanup: Sunday 3:00 AM');
  }

  /**
   * Get backup type from filename
   * @param {string} filename - Backup filename
   * @returns {string} Backup type
   */
  getBackupType(filename) {
    if (filename.includes('_db.sql') || filename.endsWith('.sql')) {
      return 'database';
    } else if (filename.includes('_files.tar.gz') || filename.endsWith('.tar.gz')) {
      return 'files';
    } else if (filename.includes('complete_backup')) {
      return 'complete';
    }
    return 'unknown';
  }

  /**
   * Get backup system status
   * @returns {Promise<Object>} Status information
   */
  async getStatus() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        initialized: this.isInitialized,
        backupPath: this.backupPath,
        retentionDays: this.retentionDays,
        totalBackups: backups.length,
        totalSize,
        latestBackup: backups[0] || null,
        oldestBackup: backups[backups.length - 1] || null
      };
    } catch (error) {
      return {
        initialized: this.isInitialized,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const backupManager = new BackupManager();

export default backupManager;
