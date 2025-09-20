import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

async function createUser() {
  try {
    console.log('🌱 Creating new user...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
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
    
    // Create test user
    const hashedPassword = await bcrypt.hash('123456', 10);
    const [testUser, userCreated] = await models.User.findOrCreate({
      where: { username: 'test' },
      defaults: {
        username: 'test',
        password: hashedPassword,
        name: 'مستخدم تجريبي',
        email: 'test@example.com',
        role: 'admin',
        isActive: true
      }
    });
    
    if (userCreated) {
      console.log('✅ Test user created successfully!');
      console.log('Username: test');
      console.log('Password: 123456');
      console.log('Role: admin');
    } else {
      console.log('✅ Test user already exists');
      console.log('Username: test');
      console.log('Password: 123456');
      console.log('Role: admin');
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createUser();
