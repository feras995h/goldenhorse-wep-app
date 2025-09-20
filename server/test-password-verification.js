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

console.log('🔍 TESTING PASSWORD VERIFICATION');
console.log('================================');

async function testPasswordVerification() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\n');

    // Get the admin user
    const [users] = await sequelize.query("SELECT id, username, password, name, role, \"isActive\" FROM users WHERE username = 'admin'");
    
    if (users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const adminUser = users[0];
    console.log('👤 Admin user found:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.isActive}`);
    console.log(`   Password hash length: ${adminUser.password?.length || 0}`);

    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const testPassword = 'admin123';
    console.log(`   Testing password: "${testPassword}"`);
    
    if (!adminUser.password) {
      console.log('❌ No password hash found');
      return;
    }

    try {
      const isValid = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`   Password verification result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('\n🔧 Resetting password...');
        const newHash = await bcrypt.hash('admin123', 10);
        
        await sequelize.query(`
          UPDATE users SET password = :password WHERE username = 'admin'
        `, {
          replacements: { password: newHash }
        });
        
        console.log('✅ Password reset successfully');
        
        // Verify again
        const [updatedUsers] = await sequelize.query("SELECT password FROM users WHERE username = 'admin'");
        const verifyAgain = await bcrypt.compare('admin123', updatedUsers[0].password);
        console.log(`   New password verification: ${verifyAgain ? '✅ VALID' : '❌ STILL INVALID'}`);
      }
    } catch (bcryptError) {
      console.log('❌ Bcrypt error:', bcryptError.message);
      
      // Force reset password
      console.log('\n🔧 Force resetting password due to bcrypt error...');
      const newHash = await bcrypt.hash('admin123', 10);
      
      await sequelize.query(`
        UPDATE users SET password = :password WHERE username = 'admin'
      `, {
        replacements: { password: newHash }
      });
      
      console.log('✅ Password force reset successfully');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed');
  }
}

testPasswordVerification();