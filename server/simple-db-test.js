import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Simple Database Connection Test');
console.log('=' .repeat(40));

console.log('Environment Variables:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USERNAME: ${process.env.DB_USERNAME}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testConnection() {
  try {
    console.log('\n🔄 Testing connection...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    console.log('\n🔄 Testing query...');
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result[0][0]);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
  } finally {
    await sequelize.close();
  }
}

testConnection();
