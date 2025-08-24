import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUsersData = () => {
  const usersPath = path.join(__dirname, '../data/users.json');
  const usersData = fs.readFileSync(usersPath, 'utf8');
  return JSON.parse(usersData);
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    // Get users from JSON file
    const users = getUsersData();
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    res.json({
      token,
      user: userData
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

export default router;
