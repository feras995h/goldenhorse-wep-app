import models, { sequelize } from '../models/index.js';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get all users
    const users = await models.User.findAll({
      attributes: ['id', 'username', 'name', 'role', 'isActive', 'createdAt']
    });
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- Username: ${user.username}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkUsers();
