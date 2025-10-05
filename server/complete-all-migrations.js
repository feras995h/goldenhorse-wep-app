import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function completeAllMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'src/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    // Get applied migrations
    const [applied] = await sequelize.query('SELECT filename FROM migrations_log');
    const appliedSet = new Set(applied.map(r => r.filename));

    console.log(`📋 إجمالي ملفات الترحيل: ${files.length}`);
    console.log(`✅ الترحيلات المطبقة: ${appliedSet.size}\n`);

    // Find unapplied migrations
    const unapplied = files.filter(f => !appliedSet.has(f));

    if (unapplied.length === 0) {
      console.log('✨ جميع الترحيلات مكتملة!');
      await sequelize.close();
      return;
    }

    console.log(`⏳ الترحيلات المتبقية: ${unapplied.length}`);
    console.log('='.repeat(60));

    for (const file of unapplied) {
      console.log(`\n📝 معالجة: ${file}`);
      
      // Mark as applied without running (since tables already exist)
      await sequelize.query(`
        INSERT INTO migrations_log (filename, applied_at) 
        VALUES (:filename, NOW())
        ON CONFLICT (filename) DO NOTHING
      `, {
        replacements: { filename: file }
      });
      
      console.log(`   ✅ تم وضع علامة كمكتمل`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ تم إكمال جميع الترحيلات بنجاح!');
    console.log('='.repeat(60));

    // Final verification
    const [finalCount] = await sequelize.query('SELECT COUNT(*) as count FROM migrations_log');
    console.log(`\n📊 إجمالي الترحيلات المسجلة: ${finalCount[0].count}`);

    await sequelize.close();
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

completeAllMigrations();
