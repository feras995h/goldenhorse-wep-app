import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function checkHierarchy() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // فحص الحسابات مع parent
    const [result] = await sequelize.query(`
      SELECT 
        a.code, 
        a.name, 
        a.level,
        a."parentId",
        p.code as parent_code,
        p.name as parent_name
      FROM accounts a
      LEFT JOIN accounts p ON a."parentId" = p.id
      WHERE a.level > 1
      ORDER BY a.code
      LIMIT 10
    `);
    
    console.log('🔍 عينة من الحسابات مع parent:');
    result.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (مستوى ${acc.level}) -> parent: ${acc.parent_code || 'NULL'}`);
    });
    
    // فحص الحسابات بدون parent
    const [orphans] = await sequelize.query(`
      SELECT COUNT(*) as count FROM accounts 
      WHERE level > 1 AND "parentId" IS NULL
    `);
    
    console.log(`\n📊 حسابات مستوى عالي بدون parent: ${orphans[0].count}`);
    
    // فحص parent غير موجود
    const [missingParents] = await sequelize.query(`
      SELECT COUNT(*) as count FROM accounts a
      LEFT JOIN accounts p ON a."parentId" = p.id
      WHERE a."parentId" IS NOT NULL AND p.id IS NULL
    `);
    
    console.log(`📊 حسابات مع parent غير موجود: ${missingParents[0].count}`);
    
    // إحصائيات عامة
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN level = 1 THEN 1 END) as level1,
        COUNT(CASE WHEN level = 2 THEN 1 END) as level2,
        COUNT(CASE WHEN level = 3 THEN 1 END) as level3,
        COUNT(CASE WHEN level = 4 THEN 1 END) as level4,
        COUNT(CASE WHEN "parentId" IS NOT NULL THEN 1 END) as with_parent,
        COUNT(CASE WHEN "parentId" IS NULL THEN 1 END) as without_parent
      FROM accounts
    `);
    
    const stat = stats[0];
    console.log('\n📊 إحصائيات عامة:');
    console.log(`   إجمالي الحسابات: ${stat.total}`);
    console.log(`   المستوى 1: ${stat.level1}`);
    console.log(`   المستوى 2: ${stat.level2}`);
    console.log(`   المستوى 3: ${stat.level3}`);
    console.log(`   المستوى 4: ${stat.level4}`);
    console.log(`   مع parent: ${stat.with_parent}`);
    console.log(`   بدون parent: ${stat.without_parent}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkHierarchy();
