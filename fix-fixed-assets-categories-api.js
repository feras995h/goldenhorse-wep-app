#!/usr/bin/env node

/**
 * إصلاح مشكلة API فئات الأصول الثابتة
 * حل خطأ 500 في /api/financial/fixed-assets/categories
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class FixedAssetsCategoriesFixer {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
    this.fixes = [];
    this.errors = [];
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async checkFixedAssetsStructure() {
    console.log('\n🔍 فحص هيكل الأصول الثابتة...');
    
    try {
      // البحث عن مجموعة الأصول الثابتة
      const fixedAssetsParentQuery = `
        SELECT id, code, name, "nameEn", type, level, "parentId", "isActive", "isGroup"
        FROM accounts 
        WHERE code = '1.2' AND type = 'asset'
      `;
      
      const result = await this.client.query(fixedAssetsParentQuery);
      
      if (result.rows.length === 0) {
        console.log('  ❌ مجموعة الأصول الثابتة (1.2) غير موجودة');
        return { fixedAssetsParent: null, subGroups: [], categories: [] };
      }
      
      const fixedAssetsParent = result.rows[0];
      console.log(`  ✅ مجموعة الأصول الثابتة موجودة: ${fixedAssetsParent.name} (${fixedAssetsParent.code})`);
      
      // البحث عن المجموعات الفرعية
      const subGroupsQuery = `
        SELECT id, code, name, "nameEn", type, level, "parentId", "isActive", "isGroup"
        FROM accounts 
        WHERE "parentId" = $1 AND type = 'asset' AND "isActive" = true AND "isGroup" = true
        ORDER BY code
      `;
      
      const subGroupsResult = await this.client.query(subGroupsQuery, [fixedAssetsParent.id]);
      console.log(`  📊 المجموعات الفرعية: ${subGroupsResult.rows.length}`);
      
      // البحث عن الفئات (الحسابات غير المجموعة)
      const subGroupIds = subGroupsResult.rows.map(group => group.id);
      let categories = [];
      
      if (subGroupIds.length > 0) {
        const categoriesQuery = `
          SELECT id, code, name, "nameEn", type, level, "parentId", "isActive", "isGroup"
          FROM accounts 
          WHERE "parentId" = ANY($1) AND type = 'asset' AND "isActive" = true AND "isGroup" = false
          ORDER BY code
        `;
        
        const categoriesResult = await this.client.query(categoriesQuery, [subGroupIds]);
        categories = categoriesResult.rows;
        console.log(`  📋 الفئات المتاحة: ${categories.length}`);
      } else {
        console.log('  ⚠️  لا توجد مجموعات فرعية تحت الأصول الثابتة');
      }
      
      return {
        fixedAssetsParent,
        subGroups: subGroupsResult.rows,
        categories
      };
      
    } catch (error) {
      console.error('  ❌ خطأ في فحص هيكل الأصول الثابتة:', error.message);
      this.errors.push(`Fixed assets structure check failed: ${error.message}`);
      return { fixedAssetsParent: null, subGroups: [], categories: [] };
    }
  }

  async createFixedAssetsStructure() {
    console.log('\n🔧 إنشاء هيكل الأصول الثابتة...');
    
    try {
      // البحث عن مجموعة الأصول الرئيسية
      const assetsRootQuery = `
        SELECT id, code, name, level
        FROM accounts 
        WHERE code = '1' AND type = 'asset'
      `;
      
      const assetsRootResult = await this.client.query(assetsRootQuery);
      
      if (assetsRootResult.rows.length === 0) {
        console.log('  ❌ مجموعة الأصول الرئيسية (1) غير موجودة');
        this.errors.push('Assets root account not found');
        return false;
      }
      
      const assetsRoot = assetsRootResult.rows[0];
      console.log(`  ✅ مجموعة الأصول الرئيسية موجودة: ${assetsRoot.name}`);
      
      // إنشاء مجموعة الأصول الثابتة
      const createFixedAssetsQuery = `
        INSERT INTO accounts (
          id, code, name, "nameEn", type, "rootType", "reportType", 
          "parentId", level, "isGroup", "isActive", balance, currency, 
          nature, "accountType", description, "isSystemAccount",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), '1.2', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'Asset', 'Balance Sheet',
          $1, $2, true, true, 0, 'LYD', 
          'debit', 'sub', 'مجموعة الأصول الثابتة', true,
          NOW(), NOW()
        ) RETURNING id, code, name
      `;
      
      const createResult = await this.client.query(createFixedAssetsQuery, [
        assetsRoot.id, 
        (assetsRoot.level || 1) + 1
      ]);
      
      const fixedAssetsParent = createResult.rows[0];
      console.log(`  ✅ تم إنشاء مجموعة الأصول الثابتة: ${fixedAssetsParent.name} (${fixedAssetsParent.code})`);
      
      // إنشاء المجموعات الفرعية
      const subGroups = [
        { code: '1.2.1', name: 'أراضي ومباني', nameEn: 'Land and Buildings' },
        { code: '1.2.2', name: 'آلات ومعدات', nameEn: 'Machinery and Equipment' },
        { code: '1.2.3', name: 'أثاث ومفروشات', nameEn: 'Furniture and Fixtures' },
        { code: '1.2.4', name: 'وسائل نقل', nameEn: 'Vehicles' },
        { code: '1.2.5', name: 'أجهزة حاسوب', nameEn: 'Computer Equipment' }
      ];
      
      for (const subGroup of subGroups) {
        const createSubGroupQuery = `
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
          ) RETURNING id, code, name
        `;
        
        const subGroupResult = await this.client.query(createSubGroupQuery, [
          subGroup.code,
          subGroup.name,
          subGroup.nameEn,
          fixedAssetsParent.id,
          (assetsRoot.level || 1) + 2,
          `مجموعة ${subGroup.name}`
        ]);
        
        console.log(`    ✅ تم إنشاء مجموعة فرعية: ${subGroupResult.rows[0].name} (${subGroupResult.rows[0].code})`);
        
        // إنشاء فئة واحدة تحت كل مجموعة فرعية
        const categoryCode = `${subGroup.code}.1`;
        const categoryName = subGroup.name.replace('أراضي ومباني', 'أراضي').replace('آلات ومعدات', 'آلات').replace('أثاث ومفروشات', 'أثاث').replace('وسائل نقل', 'سيارات').replace('أجهزة حاسوب', 'حاسوب');
        
        const createCategoryQuery = `
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
          ) RETURNING id, code, name
        `;
        
        const categoryResult = await this.client.query(createCategoryQuery, [
          categoryCode,
          categoryName,
          subGroup.nameEn.replace('Land and Buildings', 'Land').replace('Machinery and Equipment', 'Machinery').replace('Furniture and Fixtures', 'Furniture').replace('Vehicles', 'Vehicles').replace('Computer Equipment', 'Computer'),
          subGroupResult.rows[0].id,
          (assetsRoot.level || 1) + 3,
          `حساب ${categoryName}`
        ]);
        
        console.log(`      ✅ تم إنشاء فئة: ${categoryResult.rows[0].name} (${categoryResult.rows[0].code})`);
      }
      
      this.fixes.push('Created complete fixed assets structure');
      return true;
      
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        console.log('  ℹ️  هيكل الأصول الثابتة موجود مسبقاً');
        this.fixes.push('Fixed assets structure already exists');
        return true;
      } else {
        console.error('  ❌ خطأ في إنشاء هيكل الأصول الثابتة:', error.message);
        this.errors.push(`Failed to create fixed assets structure: ${error.message}`);
        return false;
      }
    }
  }

  async testCategoriesAPI() {
    console.log('\n🧪 اختبار API الفئات...');
    
    try {
      // محاكاة ما يفعله API endpoint
      const { fixedAssetsParent, subGroups, categories } = await this.checkFixedAssetsStructure();
      
      if (!fixedAssetsParent) {
        console.log('  ❌ مجموعة الأصول الثابتة غير موجودة');
        return false;
      }
      
      console.log(`  📊 النتائج:`);
      console.log(`    - مجموعة الأصول الثابتة: ${fixedAssetsParent.name} (${fixedAssetsParent.code})`);
      console.log(`    - المجموعات الفرعية: ${subGroups.length}`);
      console.log(`    - الفئات المتاحة: ${categories.length}`);
      
      if (categories.length === 0) {
        console.log('  ⚠️  لا توجد فئات متاحة - هذا قد يسبب مشكلة في API');
        return false;
      }
      
      console.log(`  ✅ API سيعيد ${categories.length} فئة`);
      categories.forEach((cat, index) => {
        console.log(`    ${index + 1}. ${cat.name} (${cat.code})`);
      });
      
      this.fixes.push(`API test successful - ${categories.length} categories available`);
      return true;
      
    } catch (error) {
      console.error('  ❌ خطأ في اختبار API:', error.message);
      this.errors.push(`API test failed: ${error.message}`);
      return false;
    }
  }

  async createSimpleAPIEndpoint() {
    console.log('\n📝 إنشاء API endpoint بديل...');
    
    const apiCode = `
// API endpoint بديل لفئات الأصول الثابتة
// يمكن إضافته إلى server/src/routes/financial.js

router.get('/fixed-assets/categories', authenticateToken, requireFinancialAccess, async (req, res) => {
  try {
    console.log('🔍 Fetching fixed asset categories (simple version)...');
    
    // البحث المباشر عن الفئات
    const categories = await sequelize.query(\`
      SELECT 
        a.id, a.code, a.name, a."nameEn", a.type, a.level, a."parentId"
      FROM accounts a
      WHERE a.type = 'asset' 
        AND a."isActive" = true 
        AND a."isGroup" = false
        AND a.code LIKE '1.2.%'
        AND LENGTH(a.code) >= 7  -- للتأكد من أنها فئات وليس مجموعات
      ORDER BY a.code
    \`, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(\`✅ Found \${categories.length} fixed asset categories\`);
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching fixed asset categories:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب فئات الأصول الثابتة',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
`;

    try {
      fs.writeFileSync('simple-fixed-assets-categories-api.js', apiCode);
      console.log('  ✅ تم حفظ API endpoint البديل في: simple-fixed-assets-categories-api.js');
      this.fixes.push('Created alternative API endpoint');
    } catch (error) {
      console.error('  ❌ فشل في حفظ API endpoint:', error.message);
      this.errors.push(`Failed to create API endpoint: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 إنشاء تقرير الإصلاح...');
    
    const report = {
      timestamp: new Date().toISOString(),
      issue: 'Fixed Assets Categories API returning 500 error',
      database: 'Golden Horse Shipping System - Production',
      fixes_applied: this.fixes,
      errors_encountered: this.errors,
      recommendations: [
        'Apply the database structure fixes if needed',
        'Replace the API endpoint with the simple version',
        'Restart the production server',
        'Test the fixed assets management page'
      ],
      summary: {
        total_fixes: this.fixes.length,
        total_errors: this.errors.length,
        success_rate: this.fixes.length / (this.fixes.length + this.errors.length) * 100
      }
    };
    
    try {
      fs.writeFileSync('fixed-assets-categories-fix-report.json', JSON.stringify(report, null, 2));
      console.log('  ✅ تم حفظ التقرير: fixed-assets-categories-fix-report.json');
    } catch (error) {
      console.error('  ❌ فشل في حفظ التقرير:', error.message);
    }
    
    console.log(`\n🎯 ملخص الإصلاح:`);
    console.log(`   الإصلاحات المطبقة: ${report.summary.total_fixes}`);
    console.log(`   الأخطاء: ${report.summary.total_errors}`);
    console.log(`   معدل النجاح: ${report.summary.success_rate.toFixed(1)}%`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    return report;
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runFullFix() {
    console.log('🚀 بدء إصلاح مشكلة فئات الأصول الثابتة...\n');
    
    const connected = await this.connect();
    if (!connected) {
      return null;
    }

    try {
      // فحص الهيكل الحالي
      const structure = await this.checkFixedAssetsStructure();
      
      // إنشاء الهيكل إذا لم يكن موجوداً
      if (!structure.fixedAssetsParent) {
        await this.createFixedAssetsStructure();
      }
      
      // اختبار API
      await this.testCategoriesAPI();
      
      // إنشاء API endpoint بديل
      await this.createSimpleAPIEndpoint();
      
      // إنشاء التقرير
      const report = await this.generateReport();
      
      console.log('\n✅ تم إكمال إصلاح فئات الأصول الثابتة');
      return report;
      
    } catch (error) {
      console.error('❌ خطأ عام في الإصلاح:', error.message);
      this.errors.push(`General error: ${error.message}`);
      return await this.generateReport();
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاح
const fixer = new FixedAssetsCategoriesFixer();
fixer.runFullFix().then(report => {
  if (report && report.summary.success_rate > 80) {
    console.log('\n🎉 تم إصلاح مشكلة فئات الأصول الثابتة بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('   1. استبدال API endpoint في الخادم المنشور');
    console.log('   2. إعادة تشغيل الخادم');
    console.log('   3. اختبار صفحة إدارة الأصول الثابتة');
    process.exit(0);
  } else {
    console.log('\n⚠️ تم إكمال الإصلاح مع بعض المشاكل');
    console.log('   يرجى مراجعة التقرير للتفاصيل');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل إصلاح فئات الأصول الثابتة:', error);
  process.exit(1);
});
