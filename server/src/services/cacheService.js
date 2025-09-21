import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async connect() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        onConnect: () => {
          logger.info('✅ Redis connected successfully');
          this.isConnected = true;
          this.retryCount = 0;
        },
        onError: (error) => {
          logger.error('❌ Redis connection error:', error.message);
          this.isConnected = false;
        },
        onReconnecting: () => {
          logger.warn('🔄 Redis reconnecting...');
        }
      });

      await this.redis.connect();
      return true;
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
      this.isConnected = false;
      logger.info('🔌 Redis disconnected');
    }
  }

  async get(key) {
    if (!this.isConnected) {
      logger.warn('⚠️ Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (value) {
        logger.debug(`📖 Cache hit for key: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`📭 Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`❌ Error getting cache key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected) {
      logger.warn('⚠️ Redis not connected, skipping cache set');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      logger.debug(`💾 Cached key: ${key} with TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error(`❌ Error setting cache key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      logger.warn('⚠️ Redis not connected, skipping cache delete');
      return false;
    }

    try {
      await this.redis.del(key);
      logger.debug(`🗑️ Deleted cache key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error deleting cache key ${key}:`, error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Error checking cache key ${key}:`, error.message);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) {
      logger.warn('⚠️ Redis not connected, skipping cache flush');
      return false;
    }

    try {
      await this.redis.flushdb();
      logger.info('🧹 Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('❌ Error flushing cache:', error.message);
      return false;
    }
  }

  // Cache patterns for different data types
  getKeyPatterns() {
    return {
      // Financial data
      financialSummary: (dateFrom, dateTo) => `financial:summary:${dateFrom}:${dateTo}`,
      accountBalance: (accountId) => `account:balance:${accountId}`,
      trialBalance: (date) => `financial:trial_balance:${date}`,
      
      // Sales data
      salesSummary: (dateFrom, dateTo) => `sales:summary:${dateFrom}:${dateTo}`,
      customerList: (page, limit, search) => `sales:customers:${page}:${limit}:${search || 'all'}`,
      salesAnalytics: (period) => `sales:analytics:${period}`,
      
      // System data
      userPermissions: (userId) => `user:permissions:${userId}`,
      systemSettings: () => `system:settings`,
      
      // Reports
      financialReport: (type, dateFrom, dateTo) => `report:financial:${type}:${dateFrom}:${dateTo}`,
      salesReport: (type, dateFrom, dateTo) => `report:sales:${type}:${dateFrom}:${dateTo}`
    };
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern) {
    if (!this.isConnected) {
      logger.warn('⚠️ Redis not connected, skipping cache invalidation');
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`🗑️ Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.error(`❌ Error invalidating cache pattern ${pattern}:`, error.message);
      return false;
    }
  }

  // Cache statistics
  async getStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
        uptime: await this.redis.uptime()
      };
    } catch (error) {
      logger.error('❌ Error getting cache stats:', error.message);
      return null;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;
