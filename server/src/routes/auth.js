import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { blacklistToken } from '../middleware/jwtBlacklist.js';
import models from '../models/index.js';
import { trackFailedLogin } from '../middleware/securityNotifications.js';

const router = express.Router();
const { User } = models;

// Login endpoint
router.post('/login', trackFailedLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    // Find user and validate password
    const user = await User.findOne({
      where: { username: username, isActive: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Generate access token (shorter expiration)
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '8h',
        issuer: 'golden-horse-api',
        audience: 'golden-horse-client'
      }
    );

    // Generate refresh token (longer expiration)
    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'golden-horse-api',
        audience: 'golden-horse-client'
      }
    );

    // Return user data (without password) and tokens
    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    res.json({
      accessToken,
      refreshToken,
      user: userData,
      expiresIn: 8 * 60 * 60 // 8 hours in seconds
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        issuer: 'golden-horse-api',
        audience: 'golden-horse-client'
      }
    );
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    // Get user data from database
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '8h',
        issuer: 'golden-horse-api',
        audience: 'golden-horse-client'
      }
    );
    
    res.json({
      accessToken: newAccessToken,
      expiresIn: 8 * 60 * 60 // 8 hours in seconds
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// Logout endpoint (invalidate tokens)
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Decode token to get expiry time
      const decoded = jwt.decode(token);
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      
      // Add token to blacklist
      blacklistToken(token, expiryTime);
      
      console.log(`🚫 Token blacklisted for user: ${req.user.username}`);
    }
    
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success even if blacklisting fails
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  }
});

export default router;
