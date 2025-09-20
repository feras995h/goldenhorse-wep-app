import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/golden_horse_shipping');

async function createSimpleUser() {
  try {
    console.log('🌱 Creating simple user...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create admin role if not exists
    const adminRoleResult = await sequelize.query(`
      INSERT INTO roles (id, name, description, permissions, "isActive", "isSystem", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'admin', 'مدير النظام', '["all"]', true, false, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      RETURNING id;
    `);
    console.log('✅ Admin role created/verified');
    
    // Create admin user if not exists
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUserResult = await sequelize.query(`
      INSERT INTO users (id, username, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'admin', $1, 'مدير النظام', 'admin', true, NOW(), NOW())
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username;
    `, {
      bind: [hashedPassword]
    });
    
    if (adminUserResult[0].length > 0) {
      console.log('✅ Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Role: admin');
    } else {
      console.log('✅ Admin user already exists');
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSimpleUser();
