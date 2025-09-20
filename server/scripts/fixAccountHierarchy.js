import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function fixAccountHierarchy() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // إصلاح التسلسل الهرمي
    console.log('🔧 إصلاح التسلسل الهرمي للحسابات...');
    
    // الحصول على جميع الحسابات
    const [accounts] = await sequelize.query('SELECT id, code, "parentId" FROM accounts ORDER BY code');
    
    const accountMap = new Map();
    accounts.forEach(acc => accountMap.set(acc.code, acc.id));
    
    let fixedCount = 0;
    
    // إصلاح parentId للحسابات
    for (const account of accounts) {
      const codeParts = account.code.split('.');
      if (codeParts.length > 1) {
        // إنشاء كود الحساب الأب
        const parentCode = codeParts.slice(0, -1).join('.');
        const parentId = accountMap.get(parentCode);
        
        if (parentId && parentId !== account.parentId) {
          await sequelize.query('UPDATE accounts SET "parentId" = :parentId WHERE id = :id', {
            replacements: { parentId, id: account.id }
          });
          console.log(`   ✅ تم إصلاح ${account.code} -> parent: ${parentCode}`);
          fixedCount++;
        }
      }
    }
    
    console.log(`📊 تم إصلاح ${fixedCount} حساب`);
    
    // التحقق من النتائج
    const [hierarchyCheck] = await sequelize.query(`
      SELECT COUNT(*) as issues FROM accounts a
      LEFT JOIN accounts p ON a."parentId" = p.id
      WHERE a."parentId" IS NOT NULL AND p.id IS NULL
    `);
    
    console.log(`📊 مشاكل التسلسل الهرمي المتبقية: ${hierarchyCheck[0].issues}`);
    
    if (hierarchyCheck[0].issues === 0) {
      console.log('🎉 تم إصلاح التسلسل الهرمي بنجاح!');
    } else {
      console.log('⚠️ لا تزال هناك مشاكل في التسلسل الهرمي');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixAccountHierarchy();
