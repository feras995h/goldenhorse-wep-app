import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

async function createWorkingUser() {
  try {
    console.log('🌱 Creating working user...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Delete existing users to start fresh
    await models.User.destroy({ where: {} });
    console.log('🗑️  Deleted existing users');
    
    // Create admin role if not exists
    const [adminRole, created] = await models.Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        name: 'admin',
        description: 'مدير النظام',
        permissions: ['all'],
        isActive: true,
        isSystem: false
      }
    });
    console.log('✅ Admin role ready');
    
    // Create working user with simple password
    const hashedPassword = await bcrypt.hash('123', 10);
    const workingUser = await models.User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'مدير النظام',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Working user created successfully!');
    console.log('Username: admin');
    console.log('Password: 123');
    console.log('Role: admin');
    console.log('User ID:', workingUser.id);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createWorkingUser();
