import pkg from 'pg';
const { Client } = pkg;
import { v4 as uuidv4 } from 'uuid';

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function fixAccountsTableStructure() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    console.log('\n🔧 إصلاح بنية جدول accounts...\n');

    // 1. فحص بنية جدول accounts الحالية
    console.log('📊 فحص بنية جدول accounts الحالية...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'accounts' 
      ORDER BY ordinal_position;
    `);
    
    console.log('الأعمدة الموجودة في جدول accounts:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    const existingColumns = columnsResult.rows.map(row => row.column_name);

    // 2. إضافة الأعمدة المفقودة
    console.log('\n🔧 إضافة الأعمدة المفقودة...');
    
    const requiredColumns = [
      { name: 'rootType', type: 'enum_accounts_rootType', nullable: false, default: "'asset'" },
      { name: 'nature', type: 'enum_accounts_nature', nullable: true },
      { name: 'reportType', type: 'enum_accounts_reportType', nullable: true },
      { name: 'accountType', type: 'enum_accounts_accountType', nullable: true }
    ];

    // فحص ENUMs الموجودة أولاً
    console.log('\n🏷️ فحص ENUMs المطلوبة...');
    const enumsToCheck = [
      'enum_accounts_rootType',
      'enum_accounts_nature', 
      'enum_accounts_reportType',
      'enum_accounts_accountType'
    ];

    for (const enumName of enumsToCheck) {
      try {
        const enumResult = await client.query(`
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
          ORDER BY enumlabel;
        `, [enumName]);
        
        if (enumResult.rows.length > 0) {
          console.log(`✅ ${enumName} موجود مع القيم:`, enumResult.rows.map(r => r.enumlabel).join(', '));
        } else {
          console.log(`⚠️ ${enumName} غير موجود`);
        }
      } catch (error) {
        console.log(`⚠️ ${enumName} غير موجود - سيتم إنشاؤه`);
      }
    }

    // إضافة الأعمدة المفقودة
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          const nullableClause = column.nullable ? '' : ' NOT NULL';
          const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
          
          const alterQuery = `ALTER TABLE accounts ADD COLUMN "${column.name}" ${column.type}${nullableClause}${defaultClause};`;
          await client.query(alterQuery);
          console.log(`✅ تم إضافة العمود ${column.name}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ العمود ${column.name} موجود بالفعل`);
          } else {
            console.error(`❌ خطأ في إضافة العمود ${column.name}:`, error.message);
          }
        }
      } else {
        console.log(`✅ العمود ${column.name} موجود بالفعل`);
      }
    }

    // 3. تحديث القيم الافتراضية للأعمدة الجديدة
    console.log('\n🔄 تحديث القيم الافتراضية...');
    
    try {
      // تحديث rootType بناءً على type
      await client.query(`
        UPDATE accounts 
        SET "rootType" = CASE 
          WHEN type = 'asset' THEN 'asset'
          WHEN type = 'liability' THEN 'liability'
          WHEN type = 'equity' THEN 'equity'
          WHEN type = 'revenue' THEN 'revenue'
          WHEN type = 'expense' THEN 'expense'
          ELSE 'asset'
        END
        WHERE "rootType" IS NULL;
      `);
      console.log('✅ تم تحديث rootType');
    } catch (error) {
      console.error('❌ خطأ في تحديث rootType:', error.message);
    }

    // 4. إضافة الحسابات الرئيسية مع جميع الأعمدة المطلوبة
    console.log('\n📊 إضافة الحسابات الرئيسية...');
    
    const mainAccounts = [
      { 
        code: '1000', name: 'الأصول', type: 'asset', rootType: 'asset', 
        level: 1, parentId: null, nature: 'debit', reportType: 'balance_sheet', accountType: 'main'
      },
      { 
        code: '1100', name: 'الأصول المتداولة', type: 'asset', rootType: 'asset',
        level: 2, parentCode: '1000', nature: 'debit', reportType: 'balance_sheet', accountType: 'sub'
      },
      { 
        code: '1110', name: 'النقدية والبنوك', type: 'asset', rootType: 'asset',
        level: 3, parentCode: '1100', nature: 'debit', reportType: 'balance_sheet', accountType: 'detail'
      },
      { 
        code: '1120', name: 'العملاء', type: 'asset', rootType: 'asset',
        level: 3, parentCode: '1100', nature: 'debit', reportType: 'balance_sheet', accountType: 'detail'
      },
      { 
        code: '2000', name: 'الالتزامات', type: 'liability', rootType: 'liability',
        level: 1, parentId: null, nature: 'credit', reportType: 'balance_sheet', accountType: 'main'
      },
      { 
        code: '2100', name: 'الالتزامات المتداولة', type: 'liability', rootType: 'liability',
        level: 2, parentCode: '2000', nature: 'credit', reportType: 'balance_sheet', accountType: 'sub'
      },
      { 
        code: '3000', name: 'حقوق الملكية', type: 'equity', rootType: 'equity',
        level: 1, parentId: null, nature: 'credit', reportType: 'balance_sheet', accountType: 'main'
      },
      { 
        code: '4000', name: 'الإيرادات', type: 'revenue', rootType: 'revenue',
        level: 1, parentId: null, nature: 'credit', reportType: 'income_statement', accountType: 'main'
      },
      { 
        code: '5000', name: 'المصروفات', type: 'expense', rootType: 'expense',
        level: 1, parentId: null, nature: 'debit', reportType: 'income_statement', accountType: 'main'
      }
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
            INSERT INTO accounts (
              id, code, name, type, "rootType", level, "parentId", nature, "reportType", "accountType",
              "isActive", balance, "debitBalance", "creditBalance", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 0, 0, 0, NOW(), NOW())
          `, [
            accountId, account.code, account.name, account.type, account.rootType, 
            account.level, parentId, account.nature, account.reportType, account.accountType
          ]);
          
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

    // 5. اختبار نهائي
    console.log('\n🧪 اختبار نهائي...');
    
    try {
      const finalCount = await client.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`✅ إجمالي عدد الحسابات: ${finalCount.rows[0].count}`);
      
      const mainAccountsCount = await client.query('SELECT COUNT(*) as count FROM accounts WHERE level = 1');
      console.log(`✅ عدد الحسابات الرئيسية: ${mainAccountsCount.rows[0].count}`);
      
      const assetAccountsCount = await client.query('SELECT COUNT(*) as count FROM accounts WHERE type = $1', ['asset']);
      console.log(`✅ عدد حسابات الأصول: ${assetAccountsCount.rows[0].count}`);
      
    } catch (error) {
      console.error('❌ خطأ في الاختبار النهائي:', error.message);
    }

    console.log('\n🎉 تم إصلاح بنية جدول accounts بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
fixAccountsTableStructure().catch(console.error);
