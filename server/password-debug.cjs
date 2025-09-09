const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const config = require('./src/config/database.cjs');

async function debugPasswords() {
  console.log('🔍 PASSWORD DEBUG - Finding Actual Passwords');
  console.log('=' .repeat(50));
  
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];
  
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: false,
      pool: dbConfig.pool,
      dialectOptions: dbConfig.dialectOptions
    }
  );
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get actual user data with password hashes
    const [users] = await sequelize.query('SELECT id, username, password, role, "isActive", name FROM users');
    console.log(`📋 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   Password Hash: ${user.password}`);
      console.log(`   Hash Length: ${user.password.length}`);
      console.log(`   Hash Prefix: ${user.password.substring(0, 20)}...`);
      
      // Test common passwords
      const commonPasswords = ['1', 'admin123', 'admin', 'password', '123456', '12345678', 'qwerty'];
      console.log(`   Testing common passwords:`);
      
      for (const pass of commonPasswords) {
        const isValid = await bcrypt.compare(pass, user.password);
        if (isValid) {
          console.log(`   🟢 FOUND: '${pass}' is the correct password for ${user.username}`);
        }
      }
      
      // Generate new hash for known passwords
      const hash1 = await bcrypt.hash('1', 10);
      const hashAdmin = await bcrypt.hash('admin123', 10);
      
      console.log(`   Expected hash for '1': ${hash1}`);
      console.log(`   Expected hash for 'admin123': ${hashAdmin}`);
    }
    
    // Check if we need to update passwords
    console.log('\n🔧 PASSWORD UPDATE NEEDED?');
    const needsUpdate = [];
    
    for (const user of users) {
      const valid1 = await bcrypt.compare('1', user.password);
      const validAdmin = await bcrypt.compare('admin123', user.password);
      
      if (!valid1 && !validAdmin) {
        needsUpdate.push({
          username: user.username,
          currentHash: user.password,
          needsUpdate: true
        });
      }
    }
    
    if (needsUpdate.length > 0) {
      console.log('🟡 Users need password updates:');
      needsUpdate.forEach(user => {
        console.log(`   ${user.username}: needs new password`);
      });
      
      // Update passwords to known values
      console.log('\n🔄 UPDATING PASSWORDS...');
      const newHash1 = await bcrypt.hash('1', 10);
      const newHashAdmin = await bcrypt.hash('admin123', 10);
      
      await sequelize.query(`UPDATE users SET password = '${newHash1}' WHERE username = 'user'`);
      await sequelize.query(`UPDATE users SET password = '${newHashAdmin}' WHERE username = 'admin'`);
      
      console.log('✅ Passwords updated successfully!');
      console.log('   user/1');
      console.log('   admin/admin123');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

debugPasswords();