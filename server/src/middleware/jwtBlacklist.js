import Redis from 'ioredis';
import fs from 'fs';

// Try to use Redis if configured, otherwise fallback to in-memory set
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('error', (err) => console.warn('Redis error:', err.message));
    console.log('🔒 Using Redis for JWT blacklist');
  } catch (e) {
    console.warn('Could not initialize Redis, falling back to memory blacklist');
    redisClient = null;
  }
} else {
  // try default redis on localhost
  try {
    redisClient = new Redis();
    redisClient.on('error', (err) => console.warn('Redis error:', err.message));
    console.log('🔒 Using local Redis for JWT blacklist');
  } catch (e) {
    redisClient = null;
  }
}

class MemoryBlacklist {
  constructor() {
    this.blacklisted = new Set();
    this.expiries = new Map();
    // periodic cleanup
    this.timer = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  async add(token, expiryMs) {
    this.blacklisted.add(token);
    this.expiries.set(token, expiryMs);
  }

  async has(token) {
    return this.blacklisted.has(token);
  }

  cleanup() {
    const now = Date.now();
    for (const [t, exp] of this.expiries.entries()) {
      if (exp < now) {
        this.blacklisted.delete(t);
        this.expiries.delete(t);
      }
    }
  }
}

const memoryBlacklist = new MemoryBlacklist();

export const checkTokenBlacklist = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    if (redisClient) {
      const exists = await redisClient.get(`jwt:blacklist:${token}`);
      if (exists) return res.status(401).json({ message: 'Token has been revoked', code: 'TOKEN_REVOKED' });
    } else {
      const exists = await memoryBlacklist.has(token);
      if (exists) return res.status(401).json({ message: 'Token has been revoked', code: 'TOKEN_REVOKED' });
    }
  } catch (err) {
    console.warn('Blacklist check failed:', err.message);
  }

  next();
};

export const blacklistToken = async (token, expiryTimeMs) => {
  try {
    const ttlSec = Math.max(1, Math.ceil((expiryTimeMs - Date.now()) / 1000));
    if (redisClient) {
      await redisClient.set(`jwt:blacklist:${token}`, '1', 'EX', ttlSec);
    } else {
      await memoryBlacklist.add(token, expiryTimeMs);
    }
  } catch (err) {
    console.warn('Failed to blacklist token:', err.message);
  }
};

export const getBlacklistStats = async () => {
  if (redisClient) {
    // best-effort: count keys (may be slow in prod)
    try {
      const keys = await redisClient.keys('jwt:blacklist:*');
      return { totalBlacklistedTokens: keys.length };
    } catch (e) {
      return { totalBlacklistedTokens: -1 };
    }
  }
  return { totalBlacklistedTokens: memoryBlacklist.blacklisted.size };
};

export default {
  checkTokenBlacklist,
  blacklistToken,
  getBlacklistStats
};

