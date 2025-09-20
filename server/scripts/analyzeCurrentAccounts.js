import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function analyzeCurrentAccounts() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // فحص الحسابات الحالية
    const [accounts] = await sequelize.query(`
      SELECT 
        code, name, type, "rootType", level, "parentId", "isGroup", "isActive", balance, currency, nature, "accountType"
      FROM accounts 
      ORDER BY code
    `);
    
    console.log('📊 إجمالي الحسابات الحالية:', accounts.length);
    console.log('\n🏛️ الحسابات الرئيسية (المستوى 1):');
    
    const mainAccounts = accounts.filter(a => a.level === 1);
    mainAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (${acc.type}) - طبيعة: ${acc.nature}`);
    });
    
    console.log('\n📋 الحسابات الفرعية (المستوى 2):');
    const subAccounts = accounts.filter(a => a.level === 2);
    subAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (${acc.type})`);
    });
    
    console.log('\n🔍 الحسابات التفصيلية (المستوى 3+):');
    const detailAccounts = accounts.filter(a => a.level >= 3);
    console.log(`   إجمالي الحسابات التفصيلية: ${detailAccounts.length}`);
    
    // فحص أنواع الحسابات
    console.log('\n📊 توزيع الحسابات حسب النوع:');
    const typeDistribution = {};
    accounts.forEach(acc => {
      typeDistribution[acc.type] = (typeDistribution[acc.type] || 0) + 1;
    });
    
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} حساب`);
    });
    
    // فحص العمليات المالية المدعومة
    console.log('\n🔍 تحليل العمليات المالية المدعومة:');
    
    // فحص حسابات العملاء
    const customerAccounts = accounts.filter(a => 
      a.code.includes('AR-') || 
      a.code.includes('1.2.1') || 
      a.name.includes('عميل') ||
      a.name.includes('مدين')
    );
    console.log(`   حسابات العملاء: ${customerAccounts.length}`);
    
    // فحص حسابات الموردين
    const supplierAccounts = accounts.filter(a => 
      a.code.includes('AP-') || 
      a.code.includes('2.1') || 
      a.name.includes('مورد') ||
      a.name.includes('دائن')
    );
    console.log(`   حسابات الموردين: ${supplierAccounts.length}`);
    
    // فحص حسابات الأصول الثابتة
    const fixedAssetAccounts = accounts.filter(a => 
      a.code.includes('1.2') && !a.code.includes('1.2.1') ||
      a.name.includes('أصول ثابتة') ||
      a.name.includes('معدات') ||
      a.name.includes('مباني')
    );
    console.log(`   حسابات الأصول الثابتة: ${fixedAssetAccounts.length}`);
    
    // فحص حسابات المخزون
    const inventoryAccounts = accounts.filter(a => 
      a.code.includes('1.3') ||
      a.name.includes('مخزون') ||
      a.name.includes('بضاعة')
    );
    console.log(`   حسابات المخزون: ${inventoryAccounts.length}`);
    
    // فحص حسابات النقدية والبنوك
    const cashBankAccounts = accounts.filter(a => 
      a.code.includes('1.1') ||
      a.name.includes('نقد') ||
      a.name.includes('بنك') ||
      a.name.includes('صندوق')
    );
    console.log(`   حسابات النقدية والبنوك: ${cashBankAccounts.length}`);
    
    // فحص حسابات الإيرادات
    const revenueAccounts = accounts.filter(a => a.type === 'revenue');
    console.log(`   حسابات الإيرادات: ${revenueAccounts.length}`);
    
    // فحص حسابات المصروفات
    const expenseAccounts = accounts.filter(a => a.type === 'expense');
    console.log(`   حسابات المصروفات: ${expenseAccounts.length}`);
    
    console.log('\n📋 عينة من الحسابات الحالية:');
    accounts.slice(0, 20).forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (${acc.type}, مستوى ${acc.level})`);
    });
    
    // فحص المشاكل المحتملة
    console.log('\n⚠️ فحص المشاكل المحتملة:');
    
    // حسابات بدون parent صحيح
    const orphanAccounts = accounts.filter(a =>
      a.level > 1 && a.parentId && !accounts.find(p => p.id === a.parentId)
    );

    // حسابات المستوى الأول بدون parent (هذا طبيعي)
    const level1WithoutParent = accounts.filter(a => a.level === 1 && !a.parentId);

    // حسابات المستوى الأعلى بدون parent (مشكلة)
    const higherLevelWithoutParent = accounts.filter(a => a.level > 1 && !a.parentId);

    if (orphanAccounts.length > 0) {
      console.log(`   ❌ حسابات يتيمة (parent غير موجود): ${orphanAccounts.length}`);
    } else if (higherLevelWithoutParent.length > 0) {
      console.log(`   ⚠️ حسابات مستوى عالي بدون parent: ${higherLevelWithoutParent.length}`);
    } else {
      console.log(`   ✅ جميع الحسابات لها parent صحيح`);
    }
    
    // حسابات غير نشطة
    const inactiveAccounts = accounts.filter(a => !a.isActive);
    console.log(`   حسابات غير نشطة: ${inactiveAccounts.length}`);
    
    // حسابات بأرصدة
    const accountsWithBalance = accounts.filter(a => parseFloat(a.balance || 0) !== 0);
    console.log(`   حسابات بأرصدة: ${accountsWithBalance.length}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

analyzeCurrentAccounts();
