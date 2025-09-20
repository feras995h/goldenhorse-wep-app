import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'goldenhorse_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgresql',
    logging: console.log
  }
);

async function updateDatabaseForEnhancedSales() {
  console.log('🔄 بدء تحديث قاعدة البيانات للنظام المحسن للمبيعات...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // Update 1: Add customer classification fields
    console.log('\n📊 تحديث 1: إضافة حقول تصنيف العملاء');
    await updateCustomerTable();

    // Update 2: Add enhanced receipt/payment fields
    console.log('\n💰 تحديث 2: تحسين جدول الإيصالات');
    await updateReceiptTable();

    // Update 3: Add account mapping for customer types
    console.log('\n🔗 تحديث 3: إضافة ربط حسابات العملاء');
    await updateAccountMappingTable();

    // Update 4: Create company settings table
    console.log('\n🏢 تحديث 4: إنشاء جدول إعدادات الشركة');
    await createCompanySettingsTable();

    // Update 5: Add indexes for better performance
    console.log('\n⚡ تحديث 5: إضافة فهارس للأداء');
    await addPerformanceIndexes();

    // Update 6: Insert default data
    console.log('\n📝 تحديث 6: إدراج البيانات الافتراضية');
    await insertDefaultData();

    console.log('\n🎉 تم إكمال جميع التحديثات بنجاح!');
    console.log('✅ قاعدة البيانات جاهزة للنظام المحسن للمبيعات');

  } catch (error) {
    console.error('❌ خطأ في التحديث:', error.message);
  } finally {
    await sequelize.close();
  }
}

async function updateCustomerTable() {
  try {
    // Check if customerType column exists
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'customerType'
    `);

    if (columns.length === 0) {
      // Add customerType column
      await sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN "customerType" VARCHAR(20) DEFAULT 'local' CHECK ("customerType" IN ('local', 'foreign'))
      `);
      console.log('   ✅ تم إضافة عمود customerType');

      // Add nationality column
      await sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN nationality VARCHAR(50)
      `);
      console.log('   ✅ تم إضافة عمود nationality');

      // Add passportNumber column
      await sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN "passportNumber" VARCHAR(50)
      `);
      console.log('   ✅ تم إضافة عمود passportNumber');

      // Add residencyStatus column
      await sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN "residencyStatus" VARCHAR(20) CHECK ("residencyStatus" IN ('resident', 'non_resident', 'tourist'))
      `);
      console.log('   ✅ تم إضافة عمود residencyStatus');

      // Update existing customers to have local type
      await sequelize.query(`
        UPDATE customers SET "customerType" = 'local' WHERE "customerType" IS NULL
      `);
      console.log('   ✅ تم تحديث العملاء الموجودين كعملاء محليين');

    } else {
      console.log('   ℹ️ أعمدة تصنيف العملاء موجودة مسبقاً');
    }

  } catch (error) {
    console.log('   ❌ خطأ في تحديث جدول العملاء:', error.message);
  }
}

async function updateReceiptTable() {
  try {
    // Check if voucherType column exists
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'receipts' AND column_name = 'voucherType'
    `);

    if (columns.length === 0) {
      // Add voucherType column if it doesn't exist
      await sequelize.query(`
        ALTER TABLE receipts 
        ADD COLUMN "voucherType" VARCHAR(20) DEFAULT 'receipt' CHECK ("voucherType" IN ('receipt', 'payment'))
      `);
      console.log('   ✅ تم إضافة عمود voucherType');

      // Update existing receipts
      await sequelize.query(`
        UPDATE receipts SET "voucherType" = 'receipt' WHERE "voucherType" IS NULL
      `);
      console.log('   ✅ تم تحديث الإيصالات الموجودة');

    } else {
      console.log('   ℹ️ عمود voucherType موجود مسبقاً');
    }

    // Check and add other enhanced fields
    const enhancedFields = [
      { name: 'partyType', type: 'VARCHAR(20)', default: 'customer' },
      { name: 'partyId', type: 'UUID' },
      { name: 'accountId', type: 'UUID' },
      { name: 'exchangeRate', type: 'DECIMAL(10,6)', default: '1.000000' }
    ];

    for (const field of enhancedFields) {
      const [fieldExists] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'receipts' AND column_name = '${field.name}'
      `);

      if (fieldExists.length === 0) {
        let alterQuery = `ALTER TABLE receipts ADD COLUMN "${field.name}" ${field.type}`;
        if (field.default) {
          alterQuery += ` DEFAULT ${field.default}`;
        }
        
        await sequelize.query(alterQuery);
        console.log(`   ✅ تم إضافة عمود ${field.name}`);
      }
    }

  } catch (error) {
    console.log('   ❌ خطأ في تحديث جدول الإيصالات:', error.message);
  }
}

async function updateAccountMappingTable() {
  try {
    // Check if localCustomersAccount column exists
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'account_mappings' AND column_name = 'localCustomersAccount'
    `);

    if (columns.length === 0) {
      // Add localCustomersAccount column
      await sequelize.query(`
        ALTER TABLE account_mappings 
        ADD COLUMN "localCustomersAccount" UUID REFERENCES accounts(id)
      `);
      console.log('   ✅ تم إضافة عمود localCustomersAccount');

      // Add foreignCustomersAccount column
      await sequelize.query(`
        ALTER TABLE account_mappings 
        ADD COLUMN "foreignCustomersAccount" UUID REFERENCES accounts(id)
      `);
      console.log('   ✅ تم إضافة عمود foreignCustomersAccount');

      // Add cash and bank account mappings if they don't exist
      const additionalFields = [
        'cashAccount',
        'bankAccount'
      ];

      for (const field of additionalFields) {
        const [fieldExists] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'account_mappings' AND column_name = '${field}'
        `);

        if (fieldExists.length === 0) {
          await sequelize.query(`
            ALTER TABLE account_mappings 
            ADD COLUMN "${field}" UUID REFERENCES accounts(id)
          `);
          console.log(`   ✅ تم إضافة عمود ${field}`);
        }
      }

    } else {
      console.log('   ℹ️ أعمدة ربط حسابات العملاء موجودة مسبقاً');
    }

  } catch (error) {
    console.log('   ❌ خطأ في تحديث جدول ربط الحسابات:', error.message);
  }
}

async function createCompanySettingsTable() {
  try {
    // Check if company_settings table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'company_settings'
    `);

    if (tables.length === 0) {
      await sequelize.query(`
        CREATE TABLE company_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          "nameEn" VARCHAR(200),
          logo TEXT,
          address TEXT NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(100) NOT NULL,
          website VARCHAR(100),
          "taxNumber" VARCHAR(50),
          "commercialRegister" VARCHAR(50),
          "bankAccount" VARCHAR(50),
          "bankName" VARCHAR(100),
          iban VARCHAR(50),
          "swiftCode" VARCHAR(20),
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "createdBy" UUID
        )
      `);
      console.log('   ✅ تم إنشاء جدول company_settings');

    } else {
      console.log('   ℹ️ جدول company_settings موجود مسبقاً');
    }

  } catch (error) {
    console.log('   ❌ خطأ في إنشاء جدول إعدادات الشركة:', error.message);
  }
}

async function addPerformanceIndexes() {
  try {
    const indexes = [
      {
        table: 'customers',
        name: 'idx_customers_customer_type',
        columns: '"customerType"'
      },
      {
        table: 'customers',
        name: 'idx_customers_nationality',
        columns: 'nationality'
      },
      {
        table: 'receipts',
        name: 'idx_receipts_voucher_type',
        columns: '"voucherType"'
      },
      {
        table: 'receipts',
        name: 'idx_receipts_party_type',
        columns: '"partyType"'
      },
      {
        table: 'receipts',
        name: 'idx_receipts_party_id',
        columns: '"partyId"'
      },
      {
        table: 'gl_entries',
        name: 'idx_gl_entries_voucher_type_no',
        columns: '"voucherType", "voucherNo"'
      }
    ];

    for (const index of indexes) {
      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} (${index.columns})
        `);
        console.log(`   ✅ تم إنشاء فهرس ${index.name}`);
      } catch (indexError) {
        console.log(`   ⚠️ فهرس ${index.name} موجود مسبقاً أو خطأ في الإنشاء`);
      }
    }

  } catch (error) {
    console.log('   ❌ خطأ في إضافة الفهارس:', error.message);
  }
}

async function insertDefaultData() {
  try {
    // Insert default company settings
    const [existingCompany] = await sequelize.query(`
      SELECT id FROM company_settings WHERE "isActive" = true LIMIT 1
    `);

    if (existingCompany.length === 0) {
      await sequelize.query(`
        INSERT INTO company_settings (
          name, "nameEn", address, phone, email, website, 
          "taxNumber", "commercialRegister", "bankAccount", 
          "bankName", iban, "swiftCode", "isActive"
        ) VALUES (
          'منضومة وائل للخدمات البحرية',
          'Wael Maritime Services System',
          'طرابلس، ليبيا',
          '+218-21-1234567',
          'info@waelmaritimeservices.ly',
          'www.waelmaritimeservices.ly',
          '123456789',
          'CR-2024-001',
          '1234567890',
          'مصرف الجمهورية',
          'LY83002001000000001234567890',
          'CBLYLYTR',
          true
        )
      `);
      console.log('   ✅ تم إدراج إعدادات الشركة الافتراضية');
    } else {
      console.log('   ℹ️ إعدادات الشركة موجودة مسبقاً');
    }

    // Update account mapping with cash and bank accounts if they exist
    const [cashAccount] = await sequelize.query(`
      SELECT id FROM accounts 
      WHERE (name ILIKE '%نقد%' OR name ILIKE '%cash%') 
      AND type = 'asset' 
      LIMIT 1
    `);

    const [bankAccount] = await sequelize.query(`
      SELECT id FROM accounts 
      WHERE (name ILIKE '%بنك%' OR name ILIKE '%bank%') 
      AND type = 'asset' 
      LIMIT 1
    `);

    if (cashAccount.length > 0 || bankAccount.length > 0) {
      const [activeMapping] = await sequelize.query(`
        SELECT id FROM account_mappings WHERE "isActive" = true LIMIT 1
      `);

      if (activeMapping.length > 0) {
        let updateQuery = 'UPDATE account_mappings SET ';
        const updates = [];

        if (cashAccount.length > 0) {
          updates.push(`"cashAccount" = '${cashAccount[0].id}'`);
        }
        if (bankAccount.length > 0) {
          updates.push(`"bankAccount" = '${bankAccount[0].id}'`);
        }

        if (updates.length > 0) {
          updateQuery += updates.join(', ');
          updateQuery += ` WHERE id = '${activeMapping[0].id}'`;
          
          await sequelize.query(updateQuery);
          console.log('   ✅ تم تحديث ربط حسابات النقد والبنك');
        }
      }
    }

  } catch (error) {
    console.log('   ❌ خطأ في إدراج البيانات الافتراضية:', error.message);
  }
}

// Run the update
updateDatabaseForEnhancedSales();
