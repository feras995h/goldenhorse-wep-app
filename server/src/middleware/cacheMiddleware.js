import cacheService from '../services/cacheService.js';
import { logger } from '../utils/logger.js';

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key
 * @param {function} skipCondition - Function to determine if caching should be skipped
 */
export const cache = (ttl = 3600, keyGenerator = null, skipCondition = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching should be skipped
    if (skipCondition && skipCondition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultKey(req);
    
    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`📖 Serving from cache: ${cacheKey}`);
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          cacheKey: cacheKey
        });
      }

      // If not in cache, continue to route handler
      // Store original res.json to intercept response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response if it's successful
        if (data && data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            logger.error('❌ Error caching response:', err.message);
          });
        }
        
        // Send original response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('❌ Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Generate default cache key from request
 */
function generateDefaultKey(req) {
  const { path, query } = req;
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  return `${path}:${queryString}`;
}

/**
 * Cache invalidation middleware
 * @param {string|function} pattern - Cache key pattern or function to generate pattern
 */
export const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Invalidate cache after successful operation
      if (data && data.success !== false) {
        const cachePattern = typeof pattern === 'function' ? pattern(req) : pattern;
        cacheService.invalidatePattern(cachePattern).catch(err => {
          logger.error('❌ Error invalidating cache:', err.message);
        });
      }
      
      // Send original response
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache warming middleware
 * @param {function} dataFetcher - Function to fetch data for warming
 * @param {function} keyGenerator - Function to generate cache key
 * @param {number} ttl - Time to live in seconds
 */
export const warmCache = (dataFetcher, keyGenerator, ttl = 3600) => {
  return async (req, res, next) => {
    try {
      const cacheKey = keyGenerator(req);
      const exists = await cacheService.exists(cacheKey);
      
      if (!exists) {
        logger.info(`🔥 Warming cache for key: ${cacheKey}`);
        const data = await dataFetcher(req);
        if (data) {
          await cacheService.set(cacheKey, data, ttl);
        }
      }
    } catch (error) {
      logger.error('❌ Cache warming error:', error.message);
    }
    
    next();
  };
};

/**
 * Cache statistics middleware
 */
export const cacheStats = async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Error getting cache stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error getting cache statistics'
    });
  }
};

/**
 * Clear cache middleware
 */
export const clearCache = async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      await cacheService.invalidatePattern(pattern);
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`
      });
    } else {
      await cacheService.flush();
      res.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    logger.error('❌ Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache'
    });
  }
};

export default {
  cache,
  invalidateCache,
  warmCache,
  cacheStats,
  clearCache
};
