import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

async function createSimpleUser() {
  try {
    console.log('🌱 Creating simple user...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create simple user with password "1"
    const hashedPassword = await bcrypt.hash('1', 10);
    const [simpleUser, userCreated] = await models.User.findOrCreate({
      where: { username: 'user' },
      defaults: {
        username: 'user',
        password: hashedPassword,
        name: 'مستخدم بسيط',
        email: 'user@example.com',
        role: 'admin',
        isActive: true
      }
    });
    
    if (userCreated) {
      console.log('✅ Simple user created successfully!');
      console.log('Username: user');
      console.log('Password: 1');
      console.log('Role: admin');
    } else {
      console.log('✅ Simple user already exists');
      console.log('Username: user');
      console.log('Password: 1');
      console.log('Role: admin');
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSimpleUser();
