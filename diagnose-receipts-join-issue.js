import { Sequelize, DataTypes, Op } from 'sequelize';

/**
 * تشخيص مشكلة JOIN في جدول receipts
 * Diagnose Receipts JOIN Issue
 */

console.log('🔍 بدء تشخيص مشكلة JOIN في جدول receipts...\n');

// إعداد الاتصال بقاعدة البيانات
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function diagnoseReceiptsJoinIssue() {
  try {
    console.log('📊 فحص الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ الاتصال بقاعدة البيانات ناجح\n');

    // فحص أنواع البيانات في الجداول المختلفة
    console.log('🔍 فحص أنواع البيانات في الجداول...');
    
    // فحص جدول receipts
    console.log('\n📄 فحص جدول receipts...');
    const receiptsColumns = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'receipts' 
      AND column_name IN ('id', 'accountId', 'supplierId', 'createdBy')
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 أعمدة receipts المهمة:');
    receiptsColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });

    // فحص جدول accounts
    console.log('\n💼 فحص جدول accounts...');
    const accountsColumns = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'accounts' 
      AND column_name = 'id'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 عمود id في accounts:');
    accountsColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });

    // فحص جدول suppliers
    console.log('\n🏭 فحص جدول suppliers...');
    const suppliersColumns = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'suppliers' 
      AND column_name = 'id'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 عمود id في suppliers:');
    suppliersColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });

    // فحص جدول users
    console.log('\n👥 فحص جدول users...');
    const usersColumns = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'id'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 عمود id في users:');
    usersColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });

    // فحص البيانات الفعلية
    console.log('\n📊 فحص البيانات الفعلية...');
    
    // فحص receipts
    const receiptsData = await sequelize.query(`
      SELECT 
        id, 
        "accountId", 
        "supplierId", 
        "createdBy",
        pg_typeof(id) as id_type,
        pg_typeof("accountId") as account_id_type,
        pg_typeof("supplierId") as supplier_id_type,
        pg_typeof("createdBy") as created_by_type
      FROM receipts 
      LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 عينة من بيانات receipts:');
    receiptsData.forEach((receipt, index) => {
      console.log(`  ${index + 1}. ID: ${receipt.id} (${receipt.id_type})`);
      console.log(`     AccountID: ${receipt.accountId} (${receipt.account_id_type})`);
      console.log(`     SupplierID: ${receipt.supplierId} (${receipt.supplier_id_type})`);
      console.log(`     CreatedBy: ${receipt.createdBy} (${receipt.created_by_type})`);
    });

    // اختبار الاستعلام المُشكِل
    console.log('\n🧪 اختبار الاستعلام المُشكِل...');
    
    try {
      const problematicQuery = await sequelize.query(`
        SELECT count("Receipt"."id") AS "count" 
        FROM "receipts" AS "Receipt" 
        LEFT OUTER JOIN "accounts" AS "account" ON "Receipt"."accountId" = "account"."id" 
        LEFT OUTER JOIN "suppliers" AS "supplier" ON "Receipt"."supplierId" = "supplier"."id" 
        LEFT OUTER JOIN "users" AS "creator" ON "Receipt"."createdBy" = "creator"."id"
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('✅ الاستعلام نجح! النتيجة:', problematicQuery[0]);
    } catch (error) {
      console.log('❌ الاستعلام فشل! الخطأ:', error.message);
      
      // اختبار كل JOIN على حدة
      console.log('\n🔬 اختبار كل JOIN على حدة...');
      
      // اختبار JOIN مع accounts
      try {
        const accountJoin = await sequelize.query(`
          SELECT count("Receipt"."id") AS "count" 
          FROM "receipts" AS "Receipt" 
          LEFT OUTER JOIN "accounts" AS "account" ON "Receipt"."accountId" = "account"."id"
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('✅ JOIN مع accounts نجح');
      } catch (error) {
        console.log('❌ JOIN مع accounts فشل:', error.message);
      }
      
      // اختبار JOIN مع suppliers
      try {
        const supplierJoin = await sequelize.query(`
          SELECT count("Receipt"."id") AS "count" 
          FROM "receipts" AS "Receipt" 
          LEFT OUTER JOIN "suppliers" AS "supplier" ON "Receipt"."supplierId" = "supplier"."id"
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('✅ JOIN مع suppliers نجح');
      } catch (error) {
        console.log('❌ JOIN مع suppliers فشل:', error.message);
      }
      
      // اختبار JOIN مع users
      try {
        const userJoin = await sequelize.query(`
          SELECT count("Receipt"."id") AS "count" 
          FROM "receipts" AS "Receipt" 
          LEFT OUTER JOIN "users" AS "creator" ON "Receipt"."createdBy" = "creator"."id"
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('✅ JOIN مع users نجح');
      } catch (error) {
        console.log('❌ JOIN مع users فشل:', error.message);
      }
    }

    // فحص العلاقات الخارجية
    console.log('\n🔗 فحص العلاقات الخارجية...');
    const foreignKeys = await sequelize.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'receipts'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 العلاقات الخارجية لجدول receipts:');
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    console.log('\n🎯 تشخيص مكتمل!');
    
  } catch (error) {
    console.error('❌ خطأ في تشخيص مشكلة JOIN:', error.message);
    console.error('📋 تفاصيل الخطأ:', error);
  } finally {
    await sequelize.close();
  }
}

// تشغيل التشخيص
diagnoseReceiptsJoinIssue();
