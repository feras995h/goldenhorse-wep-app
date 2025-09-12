import models, { sequelize } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function createWorkingAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Delete existing admin user
    await models.User.destroy({ where: { username: 'admin' } });
    console.log('🗑️ Deleted existing admin user');
    
    // Create new admin with known password
    const plainPassword = '123456';
    console.log('🔐 Creating user with password:', plainPassword);
    
    // Hash password manually
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('🔒 Password hashed successfully');
    
    // Insert directly into database to avoid model hooks
    await sequelize.query(`
      INSERT INTO users (id, username, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'admin', '${hashedPassword}', 'مدير النظام', 'admin', true, NOW(), NOW())
    `);
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: 123456');
    
    // Test the password immediately
    const testUser = await models.User.findOne({ where: { username: 'admin' } });
    const isValid = await bcrypt.compare('123456', testUser.password);
    console.log('🧪 Password test:', isValid ? '✅ VALID' : '❌ INVALID');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createWorkingAdmin();
