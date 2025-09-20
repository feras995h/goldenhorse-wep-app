import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function renameLiabilitiesToCommitments() {
  try {
    await sequelize.authenticate();
    console.log('🔄 بدء عملية إعادة تسمية "الخصوم" إلى "الالتزامات"...');
    
    // 1. البحث عن جميع الحسابات التي تحتوي على "خصوم"
    const [accountsWithLiabilities] = await sequelize.query(`
      SELECT id, code, name, type, level
      FROM accounts 
      WHERE name ILIKE '%خصوم%'
      ORDER BY code
    `);
    
    console.log(`\n📊 تم العثور على ${accountsWithLiabilities.length} حساب يحتوي على "خصوم":`);
    
    if (accountsWithLiabilities.length > 0) {
      accountsWithLiabilities.forEach(acc => {
        console.log(`   ${acc.code}: ${acc.name} (مستوى: ${acc.level})`);
      });
      
      console.log('\n🔄 بدء عملية إعادة التسمية...');
      
      for (const account of accountsWithLiabilities) {
        const newName = account.name
          .replace(/خصوم/g, 'التزامات')
          .replace(/الخصوم/g, 'الالتزامات');
        
        if (newName !== account.name) {
          await sequelize.query(`
            UPDATE accounts 
            SET name = :newName, "updatedAt" = NOW()
            WHERE id = :accountId
          `, {
            replacements: { newName, accountId: account.id }
          });
          
          console.log(`   ✅ تم تحديث: ${account.code} من "${account.name}" إلى "${newName}"`);
        }
      }
    } else {
      console.log('   ✅ لا توجد حسابات تحتوي على كلمة "خصوم"');
    }
    
    // 2. التحقق من النتائج
    console.log('\n🔍 التحقق من النتائج...');
    const [updatedAccounts] = await sequelize.query(`
      SELECT id, code, name, type, level
      FROM accounts 
      WHERE name ILIKE '%التزام%'
      ORDER BY code
    `);
    
    console.log(`📊 الحسابات التي تحتوي على "التزام" الآن: ${updatedAccounts.length}`);
    updatedAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (مستوى: ${acc.level})`);
    });
    
    // 3. التحقق من عدم وجود "خصوم" بعد التحديث
    const [remainingLiabilities] = await sequelize.query(`
      SELECT id, code, name
      FROM accounts 
      WHERE name ILIKE '%خصوم%'
    `);
    
    if (remainingLiabilities.length === 0) {
      console.log('\n✅ تم إنجاز عملية إعادة التسمية بنجاح!');
      console.log('   🎉 لا توجد حسابات تحتوي على كلمة "خصوم" بعد الآن');
    } else {
      console.log(`\n⚠️ لا تزال هناك ${remainingLiabilities.length} حسابات تحتوي على "خصوم":`);
      remainingLiabilities.forEach(acc => {
        console.log(`   ${acc.code}: ${acc.name}`);
      });
    }
    
    // 4. عرض ملخص التغييرات
    console.log('\n📋 ملخص التغييرات:');
    console.log('================');
    console.log(`   📈 عدد الحسابات المحدثة: ${accountsWithLiabilities.length}`);
    console.log(`   📊 إجمالي حسابات الالتزامات الآن: ${updatedAccounts.length}`);
    console.log('   ✅ تم استبدال "خصوم" بـ "التزامات" في جميع أسماء الحسابات');
    
    console.log('\n🎯 التوصيات التالية:');
    console.log('   1. مراجعة الملفات البرمجية لاستبدال أي مراجع لكلمة "خصوم"');
    console.log('   2. تحديث الواجهة الأمامية إذا كانت تحتوي على نصوص "خصوم"');
    console.log('   3. مراجعة التقارير المالية للتأكد من استخدام المصطلح الجديد');
    
  } catch (error) {
    console.error('❌ خطأ في عملية إعادة التسمية:', error.message);
  } finally {
    await sequelize.close();
  }
}

renameLiabilitiesToCommitments();
