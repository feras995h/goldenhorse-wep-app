import models, { sequelize } from './server/src/models/index.js';
import bcrypt from 'bcryptjs';

async function createDatabaseAndAdmin() {
  try {
    console.log('🔧 Setting up database and admin user...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync database (create tables)
    console.log('🏗️  Creating database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await models.User.create({
      username: 'admin',
      password: 'admin123', // This will be hashed by the model hook
      name: 'مدير النظام',
      email: 'admin@goldenhorse.ly',
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
    // Test the password
    const testUser = await models.User.findOne({ where: { username: 'admin' } });
    const isValidPassword = await bcrypt.compare('admin123', testUser.password);
    console.log('🧪 Password test:', isValidPassword ? '✅ VALID' : '❌ INVALID');
    
    console.log('🎉 Setup complete! You can now test the API.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createDatabaseAndAdmin();