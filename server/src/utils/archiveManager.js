import fs from 'fs-extra';
import path from 'path';
import cron from 'node-cron';
import { sequelize } from '../models/index.js';
import models from '../models/index.js';
import monitoringManager from './monitoringManager.js';

const { JournalEntry, GLEntry, Invoice, Payment, Customer, Account } = models;

/**
 * Data Archive Manager
 * Handles archiving of old data to improve performance
 */
class ArchiveManager {
  
  constructor() {
    this.archivePath = process.env.ARCHIVE_PATH || './archives';
    this.retentionPeriods = {
      journalEntries: parseInt(process.env.JOURNAL_RETENTION_MONTHS || '24'), // 2 years
      invoices: parseInt(process.env.INVOICE_RETENTION_MONTHS || '60'), // 5 years
      payments: parseInt(process.env.PAYMENT_RETENTION_MONTHS || '60'), // 5 years
      logs: parseInt(process.env.LOG_RETENTION_DAYS || '90') // 3 months
    };
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize archive manager
   */
  async initialize() {
    try {
      // Create archive directory
      await fs.ensureDir(this.archivePath);
      
      // Schedule automatic archiving
      this.scheduleArchiving();
      
      this.isInitialized = true;
      console.log('✅ Archive manager initialized');
      
      await monitoringManager.log('info', 'Archive manager initialized', {
        archivePath: this.archivePath,
        retentionPeriods: this.retentionPeriods
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize archive manager:', error.message);
      await monitoringManager.logError(error, null, { component: 'ArchiveManager' });
    }
  }

  /**
   * Schedule automatic archiving tasks
   */
  scheduleArchiving() {
    // Archive old data monthly on the 1st at 3 AM
    cron.schedule('0 3 1 * *', async () => {
      await monitoringManager.log('info', 'Starting scheduled data archiving');
      await this.archiveOldData();
    });

    // Clean old archives quarterly
    cron.schedule('0 4 1 */3 *', async () => {
      await monitoringManager.log('info', 'Starting scheduled archive cleanup');
      await this.cleanOldArchives();
    });

    console.log('⏰ Archive scheduling configured');
  }

  /**
   * Archive old data based on retention policies
   * @returns {Promise<Object>} Archive summary
   */
  async archiveOldData() {
    const transaction = await sequelize.transaction();
    const summary = {
      journalEntries: 0,
      invoices: 0,
      payments: 0,
      totalSize: 0,
      errors: []
    };

    try {
      await monitoringManager.log('info', 'Starting data archiving process');

      // Archive journal entries
      const journalArchiveResult = await this.archiveJournalEntries(transaction);
      summary.journalEntries = journalArchiveResult.count;
      summary.totalSize += journalArchiveResult.size;

      // Archive invoices
      const invoiceArchiveResult = await this.archiveInvoices(transaction);
      summary.invoices = invoiceArchiveResult.count;
      summary.totalSize += invoiceArchiveResult.size;

      // Archive payments
      const paymentArchiveResult = await this.archivePayments(transaction);
      summary.payments = paymentArchiveResult.count;
      summary.totalSize += paymentArchiveResult.size;

      await transaction.commit();

      await monitoringManager.log('info', 'Data archiving completed successfully', { summary });

      return summary;

    } catch (error) {
      await transaction.rollback();
      summary.errors.push(error.message);
      
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'archiveOldData',
        summary 
      });
      
      throw error;
    }
  }

  /**
   * Archive old journal entries
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Archive result
   */
  async archiveJournalEntries(transaction) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - this.retentionPeriods.journalEntries);

      // Find old journal entries
      const oldEntries = await JournalEntry.findAll({
        where: {
          date: {
            [sequelize.Op.lt]: cutoffDate
          },
          status: 'posted' // Only archive posted entries
        },
        include: [
          {
            model: GLEntry,
            include: [{ model: Account }]
          }
        ],
        transaction
      });

      if (oldEntries.length === 0) {
        return { count: 0, size: 0 };
      }

      // Create archive file
      const archiveDate = new Date().toISOString().split('T')[0];
      const archiveFile = path.join(this.archivePath, `journal_entries_${archiveDate}.json`);
      
      const archiveData = {
        archiveDate: new Date().toISOString(),
        cutoffDate: cutoffDate.toISOString(),
        retentionMonths: this.retentionPeriods.journalEntries,
        entries: oldEntries.map(entry => entry.toJSON())
      };

      await fs.writeJson(archiveFile, archiveData, { spaces: 2 });

      // Delete archived entries (cascade will handle GL entries)
      const entryIds = oldEntries.map(entry => entry.id);
      await JournalEntry.destroy({
        where: { id: entryIds },
        transaction
      });

      const stats = await fs.stat(archiveFile);
      
      await monitoringManager.log('info', `Archived ${oldEntries.length} journal entries`, {
        count: oldEntries.length,
        archiveFile,
        size: stats.size
      });

      return { count: oldEntries.length, size: stats.size };

    } catch (error) {
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'archiveJournalEntries'
      });
      throw error;
    }
  }

  /**
   * Archive old invoices
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Archive result
   */
  async archiveInvoices(transaction) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - this.retentionPeriods.invoices);

      // Find old paid invoices
      const oldInvoices = await Invoice.findAll({
        where: {
          date: {
            [sequelize.Op.lt]: cutoffDate
          },
          status: 'paid' // Only archive fully paid invoices
        },
        include: [{ model: Customer }],
        transaction
      });

      if (oldInvoices.length === 0) {
        return { count: 0, size: 0 };
      }

      // Create archive file
      const archiveDate = new Date().toISOString().split('T')[0];
      const archiveFile = path.join(this.archivePath, `invoices_${archiveDate}.json`);
      
      const archiveData = {
        archiveDate: new Date().toISOString(),
        cutoffDate: cutoffDate.toISOString(),
        retentionMonths: this.retentionPeriods.invoices,
        invoices: oldInvoices.map(invoice => invoice.toJSON())
      };

      await fs.writeJson(archiveFile, archiveData, { spaces: 2 });

      // Delete archived invoices
      const invoiceIds = oldInvoices.map(invoice => invoice.id);
      await Invoice.destroy({
        where: { id: invoiceIds },
        transaction
      });

      const stats = await fs.stat(archiveFile);
      
      await monitoringManager.log('info', `Archived ${oldInvoices.length} invoices`, {
        count: oldInvoices.length,
        archiveFile,
        size: stats.size
      });

      return { count: oldInvoices.length, size: stats.size };

    } catch (error) {
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'archiveInvoices'
      });
      throw error;
    }
  }

  /**
   * Archive old payments
   * @param {Transaction} transaction - Database transaction
   * @returns {Promise<Object>} Archive result
   */
  async archivePayments(transaction) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - this.retentionPeriods.payments);

      // Find old payments
      const oldPayments = await Payment.findAll({
        where: {
          date: {
            [sequelize.Op.lt]: cutoffDate
          }
        },
        include: [{ model: Customer }],
        transaction
      });

      if (oldPayments.length === 0) {
        return { count: 0, size: 0 };
      }

      // Create archive file
      const archiveDate = new Date().toISOString().split('T')[0];
      const archiveFile = path.join(this.archivePath, `payments_${archiveDate}.json`);
      
      const archiveData = {
        archiveDate: new Date().toISOString(),
        cutoffDate: cutoffDate.toISOString(),
        retentionMonths: this.retentionPeriods.payments,
        payments: oldPayments.map(payment => payment.toJSON())
      };

      await fs.writeJson(archiveFile, archiveData, { spaces: 2 });

      // Delete archived payments
      const paymentIds = oldPayments.map(payment => payment.id);
      await Payment.destroy({
        where: { id: paymentIds },
        transaction
      });

      const stats = await fs.stat(archiveFile);
      
      await monitoringManager.log('info', `Archived ${oldPayments.length} payments`, {
        count: oldPayments.length,
        archiveFile,
        size: stats.size
      });

      return { count: oldPayments.length, size: stats.size };

    } catch (error) {
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'archivePayments'
      });
      throw error;
    }
  }

  /**
   * Clean old archive files
   * @param {number} retentionYears - Years to retain archives
   * @returns {Promise<number>} Number of deleted files
   */
  async cleanOldArchives(retentionYears = 7) {
    try {
      const files = await fs.readdir(this.archivePath);
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.archivePath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.birthtime < cutoffDate) {
          totalSize += stats.size;
          await fs.remove(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await monitoringManager.log('info', `Cleaned ${deletedCount} old archive files`, {
          deletedCount,
          totalSize,
          retentionYears
        });
      }

      return deletedCount;

    } catch (error) {
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'cleanOldArchives'
      });
      throw error;
    }
  }

  /**
   * Get archive status and statistics
   * @returns {Promise<Object>} Archive status
   */
  async getStatus() {
    try {
      const files = await fs.readdir(this.archivePath);
      let totalSize = 0;
      let fileCount = 0;
      const filesByType = {};

      for (const file of files) {
        const filePath = path.join(this.archivePath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
          
          // Categorize by type
          const type = file.split('_')[0];
          if (!filesByType[type]) {
            filesByType[type] = { count: 0, size: 0 };
          }
          filesByType[type].count++;
          filesByType[type].size += stats.size;
        }
      }

      return {
        initialized: this.isInitialized,
        archivePath: this.archivePath,
        retentionPeriods: this.retentionPeriods,
        statistics: {
          totalFiles: fileCount,
          totalSize,
          filesByType
        }
      };

    } catch (error) {
      return {
        initialized: this.isInitialized,
        error: error.message
      };
    }
  }

  /**
   * Restore data from archive
   * @param {string} archiveFile - Archive file name
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromArchive(archiveFile) {
    const transaction = await sequelize.transaction();
    
    try {
      const filePath = path.join(this.archivePath, archiveFile);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error('Archive file not found');
      }

      const archiveData = await fs.readJson(filePath);
      let restoredCount = 0;

      // Determine archive type and restore accordingly
      if (archiveFile.startsWith('journal_entries_')) {
        for (const entryData of archiveData.entries) {
          await JournalEntry.create(entryData, {
            include: [{ model: GLEntry }],
            transaction
          });
          restoredCount++;
        }
      } else if (archiveFile.startsWith('invoices_')) {
        for (const invoiceData of archiveData.invoices) {
          await Invoice.create(invoiceData, { transaction });
          restoredCount++;
        }
      } else if (archiveFile.startsWith('payments_')) {
        for (const paymentData of archiveData.payments) {
          await Payment.create(paymentData, { transaction });
          restoredCount++;
        }
      }

      await transaction.commit();

      await monitoringManager.log('info', `Restored ${restoredCount} records from archive`, {
        archiveFile,
        restoredCount
      });

      return { success: true, restoredCount };

    } catch (error) {
      await transaction.rollback();
      
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'restoreFromArchive',
        archiveFile
      });
      
      throw error;
    }
  }

  /**
   * List available archive files
   * @returns {Promise<Array>} List of archive files
   */
  async listArchives() {
    try {
      const files = await fs.readdir(this.archivePath);
      const archives = [];

      for (const file of files) {
        const filePath = path.join(this.archivePath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && file.endsWith('.json')) {
          archives.push({
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: file.split('_')[0]
          });
        }
      }

      return archives.sort((a, b) => b.created - a.created);

    } catch (error) {
      await monitoringManager.logError(error, null, { 
        component: 'ArchiveManager',
        operation: 'listArchives'
      });
      throw error;
    }
  }
}

// Create singleton instance
const archiveManager = new ArchiveManager();

export default archiveManager;
