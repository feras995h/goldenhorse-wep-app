import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

// Production database connection
const databaseUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false,
    connectTimeout: 30000
  },
  pool: {
    max: 2,
    min: 0,
    acquire: 30000,
    idle: 30000
  }
});

console.log('🔍 CHECKING PRODUCTION USERS');
console.log('============================');

async function checkUsers() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\n');

    // Check if users table exists
    const [userTables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'users'");
    if (userTables.length === 0) {
      console.log('❌ Users table does not exist');
      
      // Create admin user
      console.log('\n🔧 Creating users table and admin user...');
      
      // Create users table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          role VARCHAR(20) NOT NULL DEFAULT 'operations',
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Insert admin user
      await sequelize.query(`
        INSERT INTO users (username, password, name, email, role, "isActive") 
        VALUES ('admin', :password, 'Administrator', 'admin@goldenhorse.com', 'admin', true)
        ON CONFLICT (username) DO NOTHING
      `, {
        replacements: { password: hashedPassword }
      });
      
      console.log('✅ Admin user created successfully');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      
    } else {
      console.log('✅ Users table exists');
      
      // Check existing users
      const [users] = await sequelize.query('SELECT id, username, name, email, role, "isActive" FROM users ORDER BY "createdAt"');
      console.log(`\n👥 Found ${users.length} users:`);
      
      for (const user of users) {
        console.log(`   ${user.username} (${user.role}) - ${user.name} - Active: ${user.isActive}`);
      }
      
      // Check if admin user exists and update if needed
      const [adminUsers] = await sequelize.query("SELECT id, username FROM users WHERE username = 'admin'");
      
      if (adminUsers.length === 0) {
        console.log('\n🔧 Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await sequelize.query(`
          INSERT INTO users (username, password, name, email, role, "isActive") 
          VALUES ('admin', :password, 'Administrator', 'admin@goldenhorse.com', 'admin', true)
        `, {
          replacements: { password: hashedPassword }
        });
        
        console.log('✅ Admin user created successfully');
      } else {
        console.log('\n🔧 Updating admin user password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await sequelize.query(`
          UPDATE users SET password = :password WHERE username = 'admin'
        `, {
          replacements: { password: hashedPassword }
        });
        
        console.log('✅ Admin user password updated');
      }
    }

    // Final verification
    console.log('\n🎯 FINAL VERIFICATION:');
    const [finalUsers] = await sequelize.query('SELECT username, name, role, "isActive" FROM users WHERE username = \'admin\'');
    if (finalUsers.length > 0) {
      const admin = finalUsers[0];
      console.log(`✅ Admin user confirmed: ${admin.username} (${admin.role}) - Active: ${admin.isActive}`);
      console.log('✅ You can now login with:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Admin user not found after creation attempt');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkUsers();