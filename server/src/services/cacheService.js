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
    // تحقق من وجود Redis في البيئة أولاً
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      console.log('ℹ️ Redis not configured - running without cache');
      this.isConnected = false;
      this.redis = null;
      return false;
    }

    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 0, // لا محاولات إعادة
        lazyConnect: true,
        connectTimeout: 2000, // timeout قصير جداً
        commandTimeout: 1000,
        enableOfflineQueue: false,
        enableReadyCheck: false, // تعطيل فحص الجاهزية
        onConnect: () => {
          console.log('✅ Redis connected successfully');
          this.isConnected = true;
          this.retryCount = 0;
        },
        onError: (error) => {
          // لا نطبع أي شيء، فقط نعطل الاتصال
          this.isConnected = false;
          this.redis = null;
        },
        onReconnecting: () => {
          // لا نطبع أي شيء
        }
      });

      // محاولة الاتصال مع timeout قصير جداً
      await Promise.race([
        this.redis.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 1000)
        )
      ]);
      
      return true;
    } catch (error) {
      // لا نطبع أي شيء، فقط نعطل الخدمة
      this.isConnected = false;
      this.redis = null;
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
    if (!this.isConnected || !this.redis) {
      return null; // لا نطبع تحذيرات، فقط نرجع null
    }

    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      return null; // في حالة الخطأ، نرجع null بدون تسجيل
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.redis) {
      return false; // لا نطبع تحذيرات، فقط نرجع false
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      return false; // في حالة الخطأ، نرجع false بدون تسجيل
    }
  }

  async del(key) {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async flush() {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
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
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Cache statistics
  async getStats() {
    if (!this.isConnected || !this.redis) {
      return {
        connected: false,
        message: 'Redis not available'
      };
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
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;
