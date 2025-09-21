import { Sequelize } from 'sequelize';

async function addCategoryColumn() {
  console.log('🔧 إضافة عمود category إلى جدول fixed_assets...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fixed_assets' 
      AND column_name = 'category'
    `);

    if (results.length > 0) {
      console.log('ℹ️ عمود category موجود بالفعل');
      return;
    }

    // Add category column
    await sequelize.query(`
      ALTER TABLE fixed_assets 
      ADD COLUMN category VARCHAR(20) DEFAULT 'other'
    `);

    console.log('✅ تم إضافة عمود category بنجاح');

    // Update existing records to have default category
    await sequelize.query(`
      UPDATE fixed_assets 
      SET category = 'other' 
      WHERE category IS NULL
    `);

    console.log('✅ تم تحديث السجلات الموجودة');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

addCategoryColumn();
