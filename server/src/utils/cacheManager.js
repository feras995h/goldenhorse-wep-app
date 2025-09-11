// Redis is optional - will be loaded dynamically if needed
let Redis = null;

/**
 * Cache Manager using Redis
 * Provides caching functionality for improved performance
 */
class CacheManager {
  
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Skip Redis if not configured
      if (!process.env.REDIS_URL && process.env.NODE_ENV === 'development') {
        console.log('⚠️  Redis not configured, using memory-only cache');
        this.isConnected = false;
        return;
      }

      // Try to load Redis dynamically
      if (!Redis) {
        try {
          const ioredis = await import('ioredis');
          Redis = ioredis.default;
        } catch (error) {
          console.log('⚠️  Redis not available, using memory-only cache');
          this.isConnected = false;
          return;
        }
      }

      // Try to connect to Redis
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
      } else {
        // Try local Redis with minimal retries
        this.redis = new Redis({
          host: 'localhost',
          port: 6379,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 2000
        });
      }

      // Test connection with timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );

      await Promise.race([this.redis.ping(), timeout]);
      this.isConnected = true;

      console.log('✅ Redis cache connected successfully');

      // Set up event handlers
      this.redis.on('error', (err) => {
        console.warn('⚠️  Redis error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        console.log('🔄 Redis reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.warn('⚠️  Redis cache not available, continuing without cache:', error.message);
      this.isConnected = false;
      if (this.redis) {
        this.redis.disconnect();
        this.redis = null;
      }
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.warn('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of deleted keys
   */
  async delPattern(pattern) {
    if (!this.isConnected) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.warn('Cache pattern delete error:', error.message);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Cache exists error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return { connected: false, error: 'Redis not connected' };
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Parse Redis INFO command output
   * @param {string} info - Redis info string
   * @returns {Object} Parsed info
   */
  parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in seconds
   * @param {Function} keyGenerator - Function to generate cache key
   * @returns {Function} Express middleware
   */
  middleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      try {
        // Generate cache key
        const key = keyGenerator 
          ? keyGenerator(req) 
          : `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

        // Try to get from cache
        const cached = await this.get(key);
        if (cached) {
          console.log(`🎯 Cache hit: ${key}`);
          return res.json(cached);
        }

        // Store original json method
        const originalJson = res.json;

        // Override json method to cache response
        res.json = function(data) {
          // Cache the response
          cacheManager.set(key, data, ttl).catch(err => {
            console.warn('Failed to cache response:', err.message);
          });

          console.log(`💾 Cached response: ${key}`);
          
          // Call original json method
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.warn('Cache middleware error:', error.message);
        next();
      }
    };
  }

  /**
   * Cache function results
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if not cached
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Function result
   */
  async remember(key, fn, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      console.log(`🎯 Cache hit: ${key}`);
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn();
      await this.set(key, result, ttl);
      console.log(`💾 Cached result: ${key}`);
      return result;
    } catch (error) {
      console.warn(`Function execution failed for key ${key}:`, error.message);
      throw error;
    }
  }

  /**
   * Invalidate cache for specific patterns
   * @param {Array} patterns - Array of cache key patterns
   * @returns {Promise<number>} Total deleted keys
   */
  async invalidate(patterns) {
    if (!this.isConnected) return 0;

    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      const deleted = await this.delPattern(pattern);
      totalDeleted += deleted;
      console.log(`🗑️  Invalidated ${deleted} keys matching: ${pattern}`);
    }

    return totalDeleted;
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    if (!this.isConnected) return false;

    try {
      await this.redis.flushdb();
      console.log('🗑️  Cache cleared');
      return true;
    } catch (error) {
      console.warn('Cache clear error:', error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      console.log('👋 Redis connection closed');
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Cache key generators for common patterns
export const cacheKeys = {
  accounts: (params = {}) => `accounts:${JSON.stringify(params)}`,
  account: (id) => `account:${id}`,
  customers: (params = {}) => `customers:${JSON.stringify(params)}`,
  customer: (id) => `customer:${id}`,
  employees: (params = {}) => `employees:${JSON.stringify(params)}`,
  employee: (id) => `employee:${id}`,
  journalEntries: (params = {}) => `journal_entries:${JSON.stringify(params)}`,
  journalEntry: (id) => `journal_entry:${id}`,
  reports: (type, params = {}) => `report:${type}:${JSON.stringify(params)}`,
  financialSummary: () => 'financial_summary',
  salesSummary: () => 'sales_summary'
};

export default cacheManager;
