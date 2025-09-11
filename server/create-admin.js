import models, { sequelize } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    // Check if admin user exists
    let adminUser = await models.User.findOne({ where: { username: 'admin' } });
    
    if (!adminUser) {
      console.log('⚠️  Admin user not found. Creating...');
      
      adminUser = await models.User.create({
        username: 'admin',
        password: 'password',
        name: 'مدير النظام',
        email: 'admin@goldenhorse.com',
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const isValidPassword = await bcrypt.compare('password', adminUser.password);
    console.log('Password test result:', isValidPassword);

    // List all users
    console.log('\n👥 All users:');
    const allUsers = await models.User.findAll();
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - Active: ${user.isActive}`);
    });

    console.log('\n✅ Setup complete!');
    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password: password');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

createAdminUser();
