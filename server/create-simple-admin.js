import models, { sequelize } from './src/models/index.js';

async function createSimpleAdmin() {
  try {
    console.log('🔧 Creating simple admin user...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Delete existing admin user if exists
    await models.User.destroy({ where: { username: 'admin' } });
    console.log('🗑️ Removed existing admin user');
    
    // Create new admin user (password will be hashed by model hook)
    const adminUser = await models.User.create({
      username: 'admin',
      password: 'admin123', // This will be hashed by the model hook
      name: 'مدير النظام',
      email: 'admin@goldenhorse.ly',
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Simple admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('User ID:', adminUser.id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSimpleAdmin();
