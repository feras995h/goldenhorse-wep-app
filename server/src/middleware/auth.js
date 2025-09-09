import jwt from 'jsonwebtoken';
import models from '../models/index.js';
import { checkTokenBlacklist } from './jwtBlacklist.js';

const { User } = models;

export const authenticateToken = async (req, res, next) => {
  // First check token blacklist
  checkTokenBlacklist(req, res, async (error) => {
    if (error) return;
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'golden-horse-api',
      audience: 'golden-horse-client'
    });

    // Check if it's an access token
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type', code: 'INVALID_TOKEN_TYPE' });
    }

    // Get user data from database using Sequelize
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
    
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
      }
      return res.status(403).json({ message: 'Token verification failed' });
    }
  });
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};
