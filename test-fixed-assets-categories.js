
import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function testFixedAssetsCategories() {
  let sequelize;
  
  try {
    console.log('🧪 اختبار فئات الأصول الثابتة...');
    
    sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // اختبار API endpoint
    const [categories] = await sequelize.query(`
      SELECT a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
      FROM accounts a
      INNER JOIN accounts parent ON a."parentId" = parent.id
      WHERE parent."parentId" = (SELECT id FROM accounts WHERE code = '1.2' AND type = 'asset')
      AND a.type = 'asset' 
      AND a."isActive" = true 
      AND a."isGroup" = false
      ORDER BY a.code
    `);
    
    console.log(`📊 تم العثور على ${categories.length} فئة للأصول الثابتة`);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name}`);
    });
    
    console.log('✅ الاختبار نجح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

testFixedAssetsCategories();
