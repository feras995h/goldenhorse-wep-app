import models, { sequelize } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function debugUsers() {
  try {
    console.log('🔍 Debugging users in database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Available tables:', tables);
    
    if (!tables.includes('users')) {
      console.log('❌ Users table does not exist!');
      console.log('🔧 Creating users table...');
      await sequelize.sync({ force: false });
      console.log('✅ Tables synchronized');
    }
    
    // Get all users
    const users = await models.User.findAll();
    console.log(`\n👥 Found ${users.length} users:`);
    
    if (users.length === 0) {
      console.log('⚠️ No users found! Creating admin user...');
      
      // Create admin user with simple password
      const plainPassword = '123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const adminUser = await models.User.create({
        username: 'admin',
        password: hashedPassword,
        name: 'مدير النظام',
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: 123');
      console.log('   ID:', adminUser.id);
      
      // Test password verification
      const testPassword = await bcrypt.compare('123', adminUser.password);
      console.log('🔐 Password verification test:', testPassword ? '✅ PASS' : '❌ FAIL');
      
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
        console.log(`   Created: ${user.createdAt}`);
      });
      
      // Test login for admin user
      const adminUser = users.find(u => u.username === 'admin');
      if (adminUser) {
        console.log('\n🔐 Testing password verification for admin user:');
        const passwords = ['123', 'admin123', 'password', 'admin', '1'];
        
        for (const pwd of passwords) {
          const isValid = await bcrypt.compare(pwd, adminUser.password);
          console.log(`   Password "${pwd}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

debugUsers();
