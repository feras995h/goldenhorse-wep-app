import models, { sequelize } from './src/models/index.js';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('\n📊 Syncing database...');
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    console.log('\n👥 Checking users...');
    const users = await models.User.findAll();
    console.log(`Found ${users.length} users:`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found. Creating default admin user...');
      
      const adminUser = await models.User.create({
        username: 'admin',
        password: 'password',
        name: 'مدير النظام',
        email: 'admin@goldenhorse.com',
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Admin user created:', adminUser.username);
    } else {
      users.forEach(user => {
        console.log(`- ${user.username} (${user.role}) - Active: ${user.isActive}`);
      });
    }

    console.log('\n🎯 Testing login...');
    const testUser = await models.User.findOne({ where: { username: 'admin' } });
    if (testUser) {
      console.log('✅ Admin user found');
      console.log('Password hash:', testUser.password.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

checkDatabase();
