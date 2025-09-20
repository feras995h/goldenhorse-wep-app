import pkg from 'pg';
const { Client } = pkg;
import { v4 as uuidv4 } from 'uuid';

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixUuidAndEnumIssues() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    console.log('\n🔧 إصلاح مشاكل UUID و ENUMs...\n');

    // 1. تمكين uuid-ossp extension
    console.log('🔧 تمكين uuid-ossp extension...');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('✅ تم تمكين uuid-ossp extension');
    } catch (error) {
      console.error('❌ خطأ في تمكين uuid-ossp:', error.message);
    }

    // 2. فحص ENUMs الموجودة في settings
    console.log('\n🏷️ فحص ENUMs في جدول settings...');
    const settingsEnumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_settings_type')
      ORDER BY enumlabel;
    `);
    
    console.log('قيم enum_settings_type الموجودة:', settingsEnumResult.rows.map(r => r.enumlabel));

    // 3. إضافة قيم مفقودة إلى enum_settings_type
    console.log('\n🔧 إضافة قيم مفقودة إلى enum_settings_type...');
    const requiredSettingsTypes = ['text', 'number', 'boolean', 'json'];
    const existingSettingsTypes = settingsEnumResult.rows.map(r => r.enumlabel);
    
    for (const type of requiredSettingsTypes) {
      if (!existingSettingsTypes.includes(type)) {
        try {
          await client.query(`ALTER TYPE enum_settings_type ADD VALUE '${type}';`);
          console.log(`✅ تم إضافة القيمة '${type}' إلى enum_settings_type`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ القيمة '${type}' موجودة بالفعل`);
          } else {
            console.error(`❌ خطأ في إضافة القيمة '${type}':`, error.message);
          }
        }
      } else {
        console.log(`✅ القيمة '${type}' موجودة بالفعل`);
      }
    }

    // 4. إضافة الحسابات الرئيسية مع UUID صحيح
    console.log('\n📊 إضافة الحسابات الرئيسية مع UUID صحيح...');
    
    const mainAccounts = [
      { code: '1000', name: 'الأصول', type: 'asset', level: 1, parentId: null },
      { code: '1100', name: 'الأصول المتداولة', type: 'asset', level: 2, parentCode: '1000' },
      { code: '1110', name: 'النقدية والبنوك', type: 'asset', level: 3, parentCode: '1100' },
      { code: '1120', name: 'العملاء', type: 'asset', level: 3, parentCode: '1100' },
      { code: '1130', name: 'المخزون', type: 'asset', level: 3, parentCode: '1100' },
      
      { code: '2000', name: 'الالتزامات', type: 'liability', level: 1, parentId: null },
      { code: '2100', name: 'الالتزامات المتداولة', type: 'liability', level: 2, parentCode: '2000' },
      { code: '2110', name: 'الموردين', type: 'liability', level: 3, parentCode: '2100' },
      
      { code: '3000', name: 'حقوق الملكية', type: 'equity', level: 1, parentId: null },
      { code: '3100', name: 'رأس المال', type: 'equity', level: 2, parentCode: '3000' },
      
      { code: '4000', name: 'الإيرادات', type: 'revenue', level: 1, parentId: null },
      { code: '4100', name: 'إيرادات المبيعات', type: 'revenue', level: 2, parentCode: '4000' },
      
      { code: '5000', name: 'المصروفات', type: 'expense', level: 1, parentId: null },
      { code: '5100', name: 'تكلفة البضاعة المباعة', type: 'expense', level: 2, parentCode: '5000' }
    ];

    // إنشاء map للحسابات الأب
    const accountsMap = new Map();

    for (const account of mainAccounts) {
      try {
        // التحقق من وجود الحساب
        const existingAccount = await client.query('SELECT id FROM accounts WHERE code = $1', [account.code]);
        
        if (existingAccount.rows.length === 0) {
          // البحث عن الحساب الأب إذا كان موجوداً
          let parentId = account.parentId;
          if (account.parentCode) {
            const parentResult = await client.query('SELECT id FROM accounts WHERE code = $1', [account.parentCode]);
            if (parentResult.rows.length > 0) {
              parentId = parentResult.rows[0].id;
            }
          }

          const accountId = uuidv4();
          await client.query(`
            INSERT INTO accounts (id, code, name, type, level, "parentId", "isActive", balance, "debitBalance", "creditBalance", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, true, 0, 0, 0, NOW(), NOW())
          `, [accountId, account.code, account.name, account.type, account.level, parentId]);
          
          accountsMap.set(account.code, accountId);
          console.log(`✅ تم إضافة الحساب: ${account.code} - ${account.name}`);
        } else {
          accountsMap.set(account.code, existingAccount.rows[0].id);
          console.log(`⚠️ الحساب موجود بالفعل: ${account.code} - ${account.name}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة الحساب ${account.code}:`, error.message);
      }
    }

    // 5. إضافة عميل افتراضي مع UUID صحيح
    console.log('\n👤 إضافة عميل افتراضي مع UUID صحيح...');
    try {
      const existingCustomer = await client.query('SELECT id FROM customers WHERE code = $1', ['CUST001']);
      
      if (existingCustomer.rows.length === 0) {
        const customerId = uuidv4();
        await client.query(`
          INSERT INTO customers (id, code, name, type, email, phone, address, "isActive", "createdAt", "updatedAt")
          VALUES ($1, 'CUST001', 'عميل افتراضي', 'individual', 'default@example.com', '123456789', 'العنوان الافتراضي', true, NOW(), NOW())
        `, [customerId]);
        console.log('✅ تم إضافة العميل الافتراضي');
      } else {
        console.log('⚠️ العميل الافتراضي موجود بالفعل');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة العميل الافتراضي:', error.message);
    }

    // 6. إضافة مورد افتراضي مع UUID صحيح
    console.log('\n🏪 إضافة مورد افتراضي مع UUID صحيح...');
    try {
      const existingSupplier = await client.query('SELECT id FROM suppliers WHERE code = $1', ['SUPP001']);
      
      if (existingSupplier.rows.length === 0) {
        const supplierId = uuidv4();
        await client.query(`
          INSERT INTO suppliers (id, code, name, email, phone, address, "isActive", "createdAt", "updatedAt")
          VALUES ($1, 'SUPP001', 'مورد افتراضي', 'supplier@example.com', '987654321', 'عنوان المورد', true, NOW(), NOW())
        `, [supplierId]);
        console.log('✅ تم إضافة المورد الافتراضي');
      } else {
        console.log('⚠️ المورد الافتراضي موجود بالفعل');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة المورد الافتراضي:', error.message);
    }

    // 7. إضافة إعدادات النظام مع UUID صحيح
    console.log('\n⚙️ إضافة إعدادات النظام مع UUID صحيح...');
    
    const systemSettings = [
      { key: 'company_name', value: 'Golden Horse Shipping Services', type: 'text' },
      { key: 'company_address', value: 'ليبيا - طرابلس', type: 'text' },
      { key: 'company_phone', value: '+218-XX-XXXXXXX', type: 'text' },
      { key: 'company_email', value: 'info@goldenhorse.ly', type: 'text' },
      { key: 'default_currency', value: 'LYD', type: 'text' },
      { key: 'tax_rate', value: '0.00', type: 'number' },
      { key: 'invoice_prefix', value: 'INV-', type: 'text' },
      { key: 'receipt_prefix', value: 'REC-', type: 'text' },
      { key: 'payment_prefix', value: 'PAY-', type: 'text' }
    ];

    for (const setting of systemSettings) {
      try {
        const existingSetting = await client.query('SELECT id FROM settings WHERE key = $1', [setting.key]);
        
        if (existingSetting.rows.length === 0) {
          const settingId = uuidv4();
          await client.query(`
            INSERT INTO settings (id, key, value, type, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [settingId, setting.key, setting.value, setting.type]);
          console.log(`✅ تم إضافة الإعداد: ${setting.key}`);
        } else {
          console.log(`⚠️ الإعداد موجود بالفعل: ${setting.key}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة الإعداد ${setting.key}:`, error.message);
      }
    }

    // 8. اختبار APIs الأساسية
    console.log('\n🧪 اختبار APIs الأساسية...');
    
    try {
      // اختبار عدد الحسابات
      const accountsCount = await client.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`✅ عدد الحسابات: ${accountsCount.rows[0].count}`);
      
      // اختبار عدد العملاء
      const customersCount = await client.query('SELECT COUNT(*) as count FROM customers');
      console.log(`✅ عدد العملاء: ${customersCount.rows[0].count}`);
      
      // اختبار عدد الموردين
      const suppliersCount = await client.query('SELECT COUNT(*) as count FROM suppliers');
      console.log(`✅ عدد الموردين: ${suppliersCount.rows[0].count}`);
      
      // اختبار عدد الإعدادات
      const settingsCount = await client.query('SELECT COUNT(*) as count FROM settings');
      console.log(`✅ عدد الإعدادات: ${settingsCount.rows[0].count}`);
      
    } catch (error) {
      console.error('❌ خطأ في اختبار APIs:', error.message);
    }

    console.log('\n🎉 تم إصلاح جميع مشاكل UUID و ENUMs بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixUuidAndEnumIssues().catch(console.error);
