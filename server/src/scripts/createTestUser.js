import bcrypt from 'bcryptjs';
import { User, Role } from '../models/index.js';

async function createTestUser() {
  try {
    console.log('🌱 Creating test user...');
    
    // Check if admin role exists
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      console.log('❌ Admin role not found, creating it...');
      await Role.create({
        name: 'admin',
        description: 'مدير النظام',
        permissions: ['all'],
        isActive: true,
        isSystem: false
      });
    }
    
    // Check if test user exists
    const existingUser = await User.findOne({ where: { username: 'test' } });
    if (existingUser) {
      console.log('✅ Test user already exists');
      return;
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testUser = await User.create({
      username: 'test',
      password: hashedPassword,
      name: 'مستخدم تجريبي',
      email: 'test@example.com',
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Test user created successfully!');
    console.log('Username: test');
    console.log('Password: test123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
