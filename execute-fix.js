import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function executeFix() {
  let sequelize;
  
  try {
    console.log('🔧 تنفيذ إصلاح مشكلة اختيار الفئة في الأصول الثابتة...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(60));
    
    sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // 1. تحقق من الحساب الرئيسي للأصول
    console.log('\n1️⃣ التحقق من الحساب الرئيسي للأصول...');
    const [assetsRoot] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "isActive"
      FROM accounts 
      WHERE code = '1' AND type = 'asset'
    `);
    
    if (assetsRoot.length > 0) {
      console.log('✅ الحساب الرئيسي للأصول موجود:', assetsRoot[0].name, `(${assetsRoot[0].code})`);
    } else {
      console.log('❌ الحساب الرئيسي للأصول غير موجود - سيتم إنشاؤه...');
      await sequelize.query(`
        INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '1', 'الأصول', 'Assets', 'asset', 'Asset', 'Balance Sheet', NULL, 1, true, true, 0, 'LYD', 'debit', 'main', 'حساب الأصول الرئيسي', true, NOW(), NOW())
      `);
      console.log('✅ تم إنشاء الحساب الرئيسي للأصول');
    }
    
    // 2. تحقق من مجموعة الأصول الثابتة
    console.log('\n2️⃣ التحقق من مجموعة الأصول الثابتة...');
    const [fixedAssetsParent] = await sequelize.query(`
      SELECT id, code, name, "nameEn", type, level, "parentId", "isActive"
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    `);
    
    let fixedAssetsParentId;
    if (fixedAssetsParent.length > 0) {
      fixedAssetsParentId = fixedAssetsParent[0].id;
      console.log('✅ مجموعة الأصول الثابتة موجودة:', fixedAssetsParent[0].name, `(${fixedAssetsParent[0].code})`);
    } else {
      console.log('❌ مجموعة الأصول الثابتة غير موجودة - سيتم إنشاؤها...');
      const [newParent] = await sequelize.query(`
        INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '1.2', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'Asset', 'Balance Sheet', (SELECT id FROM accounts WHERE code = '1' AND type = 'asset' LIMIT 1), 2, true, true, 0, 'LYD', 'debit', 'sub', 'مجموعة الأصول الثابتة', true, NOW(), NOW())
        RETURNING id
      `);
      fixedAssetsParentId = newParent[0].id;
      console.log('✅ تم إنشاء مجموعة الأصول الثابتة');
    }
    
    // 3. تحقق من الفئات الموجودة
    console.log('\n3️⃣ التحقق من الفئات الموجودة...');
    const [existingCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", "isActive", "isGroup"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset'
      ORDER BY code
    `, {
      replacements: { parentId: fixedAssetsParentId }
    });
    
    console.log(`📊 تم العثور على ${existingCategories.length} فئة موجودة:`);
    existingCategories.forEach((cat, index) => {
      const status = cat.isActive ? '✅' : '❌';
      const type = cat.isGroup ? '(مجموعة)' : '(فئة)';
      console.log(`   ${index + 1}. ${status} ${cat.code} - ${cat.name} ${type}`);
    });
    
    // 4. إنشاء الفئات الافتراضية
    console.log('\n4️⃣ إنشاء الفئات الافتراضية...');
    
    const defaultCategories = [
      { code: '1.2.1', name: 'سيارات', nameEn: 'Vehicles' },
      { code: '1.2.2', name: 'معدات وآلات', nameEn: 'Equipment and Machinery' },
      { code: '1.2.3', name: 'أثاث', nameEn: 'Furniture' },
      { code: '1.2.4', name: 'مباني', nameEn: 'Buildings' },
      { code: '1.2.5', name: 'أجهزة حاسوب', nameEn: 'Computers' },
      { code: '1.2.6', name: 'أراضي', nameEn: 'Land' }
    ];
    
    let createdCount = 0;
    for (const category of defaultCategories) {
      const existing = existingCategories.find(cat => cat.code === category.code);
      if (!existing) {
        try {
          await sequelize.query(`
            INSERT INTO accounts (id, code, name, "nameEn", type, "rootType", "reportType", "parentId", level, "isGroup", "isActive", balance, currency, nature, "accountType", description, "isSystemAccount", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), :code, :name, :nameEn, 'asset', 'Asset', 'Balance Sheet', :parentId, 3, false, true, 0, 'LYD', 'debit', 'sub', :description, true, NOW(), NOW())
          `, {
            replacements: {
              code: category.code,
              name: category.name,
              nameEn: category.nameEn,
              parentId: fixedAssetsParentId,
              description: `فئة أصل ثابت: ${category.name}`
            }
          });
          console.log(`✅ تم إنشاء الفئة: ${category.code} - ${category.name}`);
          createdCount++;
        } catch (error) {
          console.log(`⚠️  خطأ في إنشاء الفئة ${category.code}:`, error.message);
        }
      } else {
        console.log(`✅ الفئة موجودة بالفعل: ${category.code} - ${category.name}`);
      }
    }
    
    // 5. التحقق النهائي
    console.log('\n5️⃣ التحقق النهائي...');
    const [finalCategories] = await sequelize.query(`
      SELECT id, code, name, "nameEn", "isActive"
      FROM accounts 
      WHERE "parentId" = :parentId AND type = 'asset' AND "isActive" = true
      ORDER BY code
    `, {
      replacements: { parentId: fixedAssetsParentId }
    });
    
    console.log(`\n🎉 النتيجة النهائية: ${finalCategories.length} فئة متاحة:`);
    finalCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.code} - ${cat.name} (ID: ${cat.id})`);
    });
    
    if (finalCategories.length > 0) {
      console.log('\n✅ تم إصلاح مشكلة اختيار الفئة بنجاح!');
      console.log('💡 يمكنك الآن إضافة أصول ثابتة واختيار الفئات.');
      console.log(`📊 تم إنشاء ${createdCount} فئة جديدة`);
    } else {
      console.log('\n❌ لم يتم العثور على فئات. يرجى التحقق من قاعدة البيانات يدوياً.');
    }
    
    // 6. اختبار API
    console.log('\n6️⃣ اختبار API...');
    console.log('🔗 يمكنك الآن اختبار API باستخدام:');
    console.log('   GET /api/financial/fixed-assets/categories');
    console.log('   مع Authorization header');
    
  } catch (error) {
    console.error('❌ خطأ في تنفيذ الإصلاح:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تنفيذ الإصلاح
executeFix();
