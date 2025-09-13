import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة من المجلد الجذر
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 فحص بنية جدول الحسابات في PostgreSQL...');

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false
  }
});

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
    
    // فحص بنية جدول accounts
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'accounts' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 بنية جدول accounts:');
    console.log('العمود\t\t\tالنوع\t\t\tيقبل NULL\tالقيمة الافتراضية');
    console.log('─'.repeat(80));
    
    columns.forEach(col => {
      console.log(`${col.column_name.padEnd(20)}\t${col.data_type.padEnd(15)}\t${col.is_nullable}\t\t${col.column_default || 'NULL'}`);
    });
    
    // فحص عينة من البيانات
    const [sampleData] = await sequelize.query('SELECT * FROM accounts LIMIT 3');
    
    console.log('\n📊 عينة من البيانات:');
    console.log(JSON.stringify(sampleData, null, 2));
    
  } catch (error) {
    console.error('❌ خطأ في فحص بنية الجدول:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔒 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

checkTableStructure();
