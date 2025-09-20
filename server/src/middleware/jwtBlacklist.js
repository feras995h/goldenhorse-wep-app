import fs from 'fs';

// Use in-memory blacklist only
console.log('🔒 Using memory-only JWT blacklist');

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
    const exists = await memoryBlacklist.has(token);
    if (exists) return res.status(401).json({ message: 'Token has been revoked', code: 'TOKEN_REVOKED' });
  } catch (err) {
    console.warn('Blacklist check failed:', err.message);
  }

  next();
};

export const blacklistToken = async (token, expiryTimeMs) => {
  try {
    await memoryBlacklist.add(token, expiryTimeMs);
  } catch (err) {
    console.warn('Failed to blacklist token:', err.message);
  }
};

export const getBlacklistStats = async () => {
  return { totalBlacklistedTokens: memoryBlacklist.blacklisted.size };
};

export default {
  checkTokenBlacklist,
  blacklistToken,
  getBlacklistStats
};

