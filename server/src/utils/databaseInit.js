import { sequelize } from '../models/index.js';
import models from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Database initialization and health check utilities
 */
class DatabaseInitializer {
  
  /**
   * Test database connection with detailed error reporting
   */
  static async testConnection() {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic connection
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      
      // Test query execution (database-agnostic)
      let result;
      if (sequelize.getDialect() === 'sqlite') {
        result = await sequelize.query("SELECT datetime('now') as current_time");
      } else {
        result = await sequelize.query('SELECT NOW() as current_time');
      }
      console.log(`✅ Database query test successful - Current time: ${result[0][0].current_time}`);
      
      return { success: true, message: 'Database connection healthy' };
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      
      // Provide specific error guidance
      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Suggestion: Check if PostgreSQL service is running');
        console.error('   - Local: brew services start postgresql (Mac) or systemctl start postgresql (Linux)');
        console.error('   - Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres');
      } else if (error.code === 'ENOTFOUND') {
        console.error('💡 Suggestion: Check database host configuration');
        console.error('   - Verify DB_HOST in .env file');
        console.error('   - Ensure network connectivity to database server');
      } else if (error.message.includes('authentication failed')) {
        console.error('💡 Suggestion: Check database credentials');
        console.error('   - Verify DB_USERNAME and DB_PASSWORD in .env file');
        console.error('   - Ensure user has proper permissions');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('💡 Suggestion: Create the database');
        console.error('   - Run: createdb golden_horse_dev (or your DB_NAME)');
        console.error('   - Or use pgAdmin/psql to create the database');
      }
      
      return { success: false, error: error.message, code: error.code };
    }
  }
  
  /**
   * Initialize database with tables and basic data
   */
  static async initializeDatabase() {
    try {
      console.log('🏗️  Initializing database...');
      
      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Database connection failed: ${connectionTest.error}`);
      }
      
      // Skip automatic table synchronization since we've manually fixed the table structures
      console.log('📋 Skipping automatic database table synchronization (tables already updated)');
      
      // Ensure default main accounts exist
      try {
        const { ensureDefaultMainAccounts, ensureOperationalSubAccounts } = await import('./ensureDefaultAccounts.js');
        const accountsResult = await ensureDefaultMainAccounts(models);

        if (accountsResult.success) {
          console.log(`✅ الحسابات الرئيسية: ${accountsResult.total} حساب (${accountsResult.created} جديد، ${accountsResult.existing} موجود)`);
        } else {
          console.warn('⚠️  تحذير: مشكلة في ضمان وجود الحسابات الرئيسية:', accountsResult.error);
        }

        // Ensure operational sub-accounts (cash, bank, AR, revenues) exist
        const opResult = await ensureOperationalSubAccounts(models);
        if (opResult.success) {
          console.log(`✅ الحسابات التشغيلية: تمت إضافة ${opResult.created} (إن وجدت)`);
        }

        // Ensure an active AccountMapping exists; create default if missing and enrich with storage/handling
        try {
          const mapping = await models.AccountMapping.getActiveMapping();
          if (!mapping) {
            const created = await models.AccountMapping.createDefaultMapping(null);
            console.log('✅ تم إنشاء AccountMapping افتراضي');
            // Try to enrich with storage/handling accounts if available
            const { Account } = models;
            const storage = await Account.findOne({ where: { name: { [Op.like]: '%التخزين%' }, type: 'revenue' } })
              || await Account.findOne({ where: { nameEn: { [Op.like]: '%Storage%' }, type: 'revenue' } });
            const handling = await Account.findOne({ where: { name: { [Op.like]: '%المناولة%' }, type: 'revenue' } })
              || await Account.findOne({ where: { nameEn: { [Op.like]: '%Handling%' }, type: 'revenue' } });
            if (storage || handling) {
              await created.update({ storageAccount: storage?.id || created.storageAccount, handlingFeeAccount: handling?.id || created.handlingFeeAccount });
              console.log('✅ تم تعزيز AccountMapping بحسابات التخزين/المناولة');
            }
          }
        } catch (mapErr) {
          console.warn('⚠️  تحذير: تعذر ضمان AccountMapping الافتراضي:', mapErr.message);
        }
      } catch (error) {
        console.warn('⚠️  تحذير: لا يمكن ضمان وجود الحسابات الأساسية/التشغيلية:', error.message);
      }

      // Check if we need to seed basic data
      const userCount = await models.User.count();
      if (userCount === 0) {
        console.log('🌱 Database appears empty, consider running seed scripts');
        console.log('   - npm run seed-basic-data');
      } else {
        console.log(`✅ Database has ${userCount} users - appears to be initialized`);
      }

      return { success: true, message: 'Database initialized successfully' };
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get database health status
   */
  static async getHealthStatus() {
    try {
      const startTime = Date.now();
      
      // Test connection
      await sequelize.authenticate();
      
      // Test query performance
      await sequelize.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      // Get connection pool status
      const pool = sequelize.connectionManager.pool;
      const poolStatus = {
        size: pool.size,
        available: pool.available,
        using: pool.using,
        waiting: pool.waiting
      };
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        pool: poolStatus,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Create database if it doesn't exist (for development)
   */
  static async createDatabaseIfNotExists() {
    const { Sequelize } = await import('sequelize');
    
    try {
      // Connect to postgres database to create our app database
      const adminSequelize = new Sequelize('postgres', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
      });
      
      await adminSequelize.authenticate();
      
      // Try to create database
      await adminSequelize.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`✅ Database "${process.env.DB_NAME}" created successfully`);
      
      await adminSequelize.close();
      return true;
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Database "${process.env.DB_NAME}" already exists`);
        return true;
      } else {
        console.error('❌ Failed to create database:', error.message);
        return false;
      }
    }
  }
}

export default DatabaseInitializer;
