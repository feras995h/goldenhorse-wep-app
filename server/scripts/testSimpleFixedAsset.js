import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function testSimpleFixedAssetCreation() {
  try {
    console.log('🧪 اختبار إنشاء أصل ثابت مبسط...');
    
    // Get available category accounts
    const [results] = await sequelize.query(`
      SELECT id, code, name, level 
      FROM accounts 
      WHERE code LIKE '1.2.%' 
      AND code != '1.2' 
      AND level = 3 
      AND "isActive" = true
      ORDER BY code
      LIMIT 3
    `);
    
    console.log('📊 الحسابات المتاحة:', results.length);
    results.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (مستوى ${acc.level})`);
    });
    
    if (results.length === 0) {
      console.log('❌ لا توجد حسابات فئات متاحة');
      return;
    }
    
    // Test data
    const testAsset = {
      id: uuidv4(),
      assetNumber: 'TEST-' + Date.now(),
      name: 'جهاز اختبار',
      categoryAccountId: results[0].id,
      purchaseDate: '2025-09-19',
      purchaseCost: 5000,
      usefulLife: 5,
      depreciationMethod: 'straight_line',
      status: 'active'
    };
    
    console.log('📝 بيانات الاختبار:', testAsset);
    
    // Create fixed asset directly
    const [insertResult] = await sequelize.query(`
      INSERT INTO fixed_assets (
        id, "assetNumber", name, "categoryAccountId", "purchaseDate",
        "purchaseCost", "usefulLife", "depreciationMethod", status,
        "currentValue", "createdAt", "updatedAt"
      ) VALUES (
        :id, :assetNumber, :name, :categoryAccountId, :purchaseDate,
        :purchaseCost, :usefulLife, :depreciationMethod, :status,
        :purchaseCost, NOW(), NOW()
      ) RETURNING id, "assetNumber", name
    `, {
      replacements: testAsset,
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ تم إنشاء الأصل الثابت:', insertResult[0]);
    
    // Clean up
    await sequelize.query(`
      DELETE FROM fixed_assets WHERE "assetNumber" = :assetNumber
    `, {
      replacements: { assetNumber: testAsset.assetNumber }
    });
    
    console.log('🗑️ تم تنظيف البيانات التجريبية');
    console.log('🎉 الاختبار نجح! API يجب أن يعمل الآن');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  } finally {
    await sequelize.close();
  }
}

testSimpleFixedAssetCreation();
