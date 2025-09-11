import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import models, { sequelize } from '../src/models/index.js';

const { User } = models;

describe('Authentication System - Unit Tests', () => {
  let adminUser;
  let testUser;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { username: ['testadmin', 'testuser', 'newuser'] } });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up any test users created during tests
    await User.destroy({ where: { username: ['testadmin', 'testuser', 'newuser'] } });
  });

  describe('User Model and Authentication Logic', () => {
    test('should create user with hashed password', async () => {
      const user = await User.create({
        username: 'testadmin',
        password: 'admin123',
        name: 'Test Admin',
        role: 'admin',
        isActive: true
      });

      expect(user.username).toBe('testadmin');
      expect(user.password).not.toBe('admin123');
      expect(user.password.startsWith('$2a$')).toBe(true);
      expect(user.role).toBe('admin');
      expect(user.isActive).toBe(true);
    });

    test('should validate password correctly', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: 'operations',
        isActive: true
      });

      const isValidPassword = await bcrypt.compare('password123', user.password);
      const isInvalidPassword = await bcrypt.compare('wrongpassword', user.password);

      expect(isValidPassword).toBe(true);
      expect(isInvalidPassword).toBe(false);
    });

    test('should find active user by username', async () => {
      await User.create({
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: 'operations',
        isActive: true
      });

      const user = await User.findOne({
        where: { username: 'testuser', isActive: true }
      });

      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
    });

    test('should not find inactive user', async () => {
      await User.create({
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: 'operations',
        isActive: false
      });

      const user = await User.findOne({
        where: { username: 'testuser', isActive: true }
      });

      expect(user).toBeNull();
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: 'admin',
        isActive: true
      });

      const token = jwt.sign(
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

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'golden-horse-api',
        audience: 'golden-horse-client'
      });

      expect(decoded.userId).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.role).toBe(user.role);
      expect(decoded.type).toBe('access');
    });

    test('should reject invalid JWT token', async () => {
      expect(() => {
        jwt.verify('invalid-token', process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Password Security', () => {
    test('should hash passwords correctly', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'plainpassword',
        name: 'Test User',
        role: 'operations',
        isActive: true
      });

      // Password should be hashed
      expect(user.password).not.toBe('plainpassword');
      expect(user.password.startsWith('$2a$')).toBe(true);

      // Should be able to verify password
      const isValid = await bcrypt.compare('plainpassword', user.password);
      expect(isValid).toBe(true);
    });

    test('should update password hash on password change', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'oldpassword',
        name: 'Test User',
        role: 'operations',
        isActive: true
      });

      const oldHash = user.password;

      await user.update({ password: 'newpassword' });
      await user.reload();

      expect(user.password).not.toBe(oldHash);

      const isValidOld = await bcrypt.compare('oldpassword', user.password);
      const isValidNew = await bcrypt.compare('newpassword', user.password);

      expect(isValidOld).toBe(false);
      expect(isValidNew).toBe(true);
    });
  });
});
