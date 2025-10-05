import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: false 
});

async function checkUser() {
  try {
    await sequelize.authenticate();
    
    const [users] = await sequelize.query(`
      SELECT id, username, email, name, role, "isActive", 
             LENGTH(password) as password_length
      FROM users 
      WHERE username = 'admin';
    `);

    if (users.length === 0) {
      console.log('❌ لا يوجد مستخدم admin');
    } else {
      console.log('✅ المستخدم موجود:');
      console.log(JSON.stringify(users[0], null, 2));
    }

    await sequelize.close();
  } catch (error) {
    console.error('خطأ:', error);
    await sequelize.close();
  }
}

checkUser();
