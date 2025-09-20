#!/usr/bin/env node

/**
 * إضافة فئات الأصول الثابتة المفقودة
 * حل مشكلة عدم وجود فئات تحت مجموعة الأصول الثابتة
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function addFixedAssetsCategories() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // البحث عن مجموعة الأصول الثابتة
    const fixedAssetsQuery = `
      SELECT id, code, name, level
      FROM accounts 
      WHERE code = '1.2' AND type = 'asset'
    `;
    
    const fixedAssetsResult = await client.query(fixedAssetsQuery);
    
    if (fixedAssetsResult.rows.length === 0) {
      console.log('❌ مجموعة الأصول الثابتة غير موجودة');
      return;
    }
    
    const fixedAssetsParent = fixedAssetsResult.rows[0];
    console.log(`✅ مجموعة الأصول الثابتة موجودة: ${fixedAssetsParent.name} (${fixedAssetsParent.code})`);

    // إنشاء المجموعات الفرعية والفئات
    const categories = [
      {
        groupCode: '1.2.1',
        groupName: 'أراضي ومباني',
        groupNameEn: 'Land and Buildings',
        items: [
          { code: '1.2.1.1', name: 'أراضي', nameEn: 'Land' },
          { code: '1.2.1.2', name: 'مباني', nameEn: 'Buildings' }
        ]
      },
      {
        groupCode: '1.2.2',
        groupName: 'آلات ومعدات',
        groupNameEn: 'Machinery and Equipment',
        items: [
          { code: '1.2.2.1', name: 'آلات صناعية', nameEn: 'Industrial Machinery' },
          { code: '1.2.2.2', name: 'معدات مكتبية', nameEn: 'Office Equipment' }
        ]
      },
      {
        groupCode: '1.2.3',
        groupName: 'أثاث ومفروشات',
        groupNameEn: 'Furniture and Fixtures',
        items: [
          { code: '1.2.3.1', name: 'أثاث مكتبي', nameEn: 'Office Furniture' },
          { code: '1.2.3.2', name: 'مفروشات', nameEn: 'Fixtures' }
        ]
      },
      {
        groupCode: '1.2.4',
        groupName: 'وسائل نقل',
        groupNameEn: 'Vehicles',
        items: [
          { code: '1.2.4.1', name: 'سيارات', nameEn: 'Cars' },
          { code: '1.2.4.2', name: 'شاحنات', nameEn: 'Trucks' }
        ]
      },
      {
        groupCode: '1.2.5',
        groupName: 'أجهزة حاسوب',
        groupNameEn: 'Computer Equipment',
        items: [
          { code: '1.2.5.1', name: 'حاسوب شخصي', nameEn: 'Personal Computers' },
          { code: '1.2.5.2', name: 'خوادم', nameEn: 'Servers' }
        ]
      }
    ];

    let totalCreated = 0;

    for (const category of categories) {
      console.log(`\n🔧 إنشاء مجموعة: ${category.groupName} (${category.groupCode})`);
      
      // إنشاء المجموعة الفرعية
      const createGroupQuery = `
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType", 
          "parentId", level, "isGroup", "isActive", balance, currency, 
          nature, "accountType", description, "isSystemAccount",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'asset', 'Asset', 'Balance Sheet',
          $4, $5, true, true, 0, 'LYD', 
          'debit', 'sub', $6, true,
          NOW(), NOW()
        ) 
        ON CONFLICT (code) DO UPDATE SET 
          name = EXCLUDED.name,
          "nameEn" = EXCLUDED."nameEn",
          "updatedAt" = NOW()
        RETURNING id, code, name
      `;
      
      const groupResult = await client.query(createGroupQuery, [
        category.groupCode,
        category.groupName,
        category.groupNameEn,
        fixedAssetsParent.id,
        fixedAssetsParent.level + 1,
        `مجموعة ${category.groupName}`
      ]);
      
      const group = groupResult.rows[0];
      console.log(`  ✅ مجموعة: ${group.name} (${group.code})`);
      totalCreated++;

      // إنشاء الفئات تحت هذه المجموعة
      for (const item of category.items) {
        const createItemQuery = `
          INSERT INTO accounts (
            id, code, name, "nameEn", type, "rootType", "reportType", 
            "parentId", level, "isGroup", "isActive", balance, currency, 
            nature, "accountType", description, "isSystemAccount",
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, 'asset', 'Asset', 'Balance Sheet',
            $4, $5, false, true, 0, 'LYD', 
            'debit', 'sub', $6, true,
            NOW(), NOW()
          ) 
          ON CONFLICT (code) DO UPDATE SET 
            name = EXCLUDED.name,
            "nameEn" = EXCLUDED."nameEn",
            "updatedAt" = NOW()
          RETURNING id, code, name
        `;
        
        const itemResult = await client.query(createItemQuery, [
          item.code,
          item.name,
          item.nameEn,
          group.id,
          fixedAssetsParent.level + 2,
          `حساب ${item.name}`
        ]);
        
        console.log(`    ✅ فئة: ${itemResult.rows[0].name} (${itemResult.rows[0].code})`);
        totalCreated++;
      }
    }

    console.log(`\n🎉 تم إنشاء ${totalCreated} حساب بنجاح!`);

    // اختبار النتيجة النهائية
    console.log('\n🧪 اختبار النتيجة النهائية...');
    
    const testQuery = `
      SELECT 
        a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId", a."isGroup"
      FROM accounts a
      WHERE a.type = 'asset' 
        AND a."isActive" = true 
        AND a.code LIKE '1.2.%'
      ORDER BY a.code
    `;
    
    const testResult = await client.query(testQuery);
    
    console.log(`📊 إجمالي حسابات الأصول الثابتة: ${testResult.rows.length}`);
    
    const groups = testResult.rows.filter(row => row.isGroup);
    const categoriesList = testResult.rows.filter(row => !row.isGroup);
    
    console.log(`  📁 المجموعات: ${groups.length}`);
    console.log(`  📋 الفئات: ${categoriesList.length}`);

    console.log('\n📋 الفئات المتاحة للأصول الثابتة:');
    categoriesList.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.code})`);
    });

    await client.end();
    console.log('\n✅ تم إكمال إضافة فئات الأصول الثابتة بنجاح!');
    
    return {
      success: true,
      totalCreated,
      totalGroups: groups.length,
      totalCategories: categoriesList.length,
      categories: categoriesList
    };

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await client.end();
    return {
      success: false,
      error: error.message
    };
  }
}

// تشغيل السكريپت
addFixedAssetsCategories().then(result => {
  if (result.success) {
    console.log('\n🎯 النتيجة النهائية:');
    console.log(`   ✅ تم إنشاء ${result.totalCreated} حساب`);
    console.log(`   📁 المجموعات: ${result.totalGroups}`);
    console.log(`   📋 الفئات: ${result.totalCategories}`);
    console.log('\n📋 الخطوات التالية:');
    console.log('   1. إعادة تشغيل الخادم المنشور');
    console.log('   2. اختبار API: /api/financial/fixed-assets/categories');
    console.log('   3. فتح صفحة إدارة الأصول الثابتة');
    console.log('   4. التأكد من ظهور الفئات في القائمة المنسدلة');
  } else {
    console.log(`\n❌ فشل في إضافة الفئات: ${result.error}`);
  }
}).catch(error => {
  console.error('❌ خطأ في تشغيل السكريپت:', error);
});
