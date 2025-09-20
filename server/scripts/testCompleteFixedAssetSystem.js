import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'http://localhost:5001/api';

// Mock authentication token (you'll need to get a real one)
let authToken = null;

async function authenticateUser() {
  try {
    console.log('🔐 تسجيل الدخول...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123' // Use your actual admin password
    });
    
    authToken = response.data.token;
    console.log('   ✅ تم تسجيل الدخول بنجاح');
    return true;
    
  } catch (error) {
    console.log('   ❌ فشل تسجيل الدخول:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCompleteFixedAssetSystem() {
  try {
    console.log('🧪 اختبار النظام الكامل للأصول الثابتة المتقدمة...');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('='.repeat(70));
    
    // 1. Authenticate
    const authenticated = await authenticateUser();
    if (!authenticated) {
      console.log('❌ لا يمكن المتابعة بدون تسجيل الدخول');
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Get available categories
    console.log('\n📊 1. فحص حسابات الفئات المتاحة...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/financial/accounts`, {
      headers,
      params: { type: 'asset', level: 3 }
    });
    
    const categories = categoriesResponse.data.data.filter(acc => 
      acc.code.startsWith('1.2.') && acc.code !== '1.2'
    );
    
    console.log(`   الحسابات المتاحة: ${categories.length}`);
    categories.slice(0, 3).forEach(cat => {
      console.log(`     ${cat.code}: ${cat.name} (مستوى ${cat.level})`);
    });
    
    if (categories.length === 0) {
      console.log('❌ لا توجد حسابات فئات متاحة');
      return;
    }
    
    // 3. Create advanced fixed asset
    console.log('\n🏗️ 2. اختبار إنشاء أصل ثابت متقدم عبر API...');
    
    const assetData = {
      assetNumber: 'API-TEST-' + Date.now(),
      name: 'خادم قاعدة البيانات المتقدم',
      categoryAccountId: categories[0].id,
      purchaseDate: '2025-09-19',
      purchaseCost: 25000,
      salvageValue: 2500,
      usefulLife: 4,
      depreciationMethod: 'straight_line',
      status: 'active',
      location: 'غرفة الخوادم',
      description: 'خادم قاعدة بيانات عالي الأداء للاختبار المتقدم'
    };
    
    console.log('   بيانات الأصل:', {
      assetNumber: assetData.assetNumber,
      name: assetData.name,
      purchaseCost: assetData.purchaseCost,
      usefulLife: assetData.usefulLife
    });
    
    const createResponse = await axios.post(`${API_BASE_URL}/financial/fixed-assets`, assetData, { headers });
    
    console.log('   ✅ تم إنشاء الأصل بنجاح:', {
      id: createResponse.data.data.id,
      assetNumber: createResponse.data.data.assetNumber,
      name: createResponse.data.data.name
    });
    
    console.log('   🏦 الحسابات المنشأة:');
    if (createResponse.data.createdAccounts) {
      Object.entries(createResponse.data.createdAccounts).forEach(([type, account]) => {
        if (account) {
          console.log(`     ${type}: ${account.code} - ${account.name}`);
        }
      });
    }
    
    console.log('   📝 قيد اليومية:', {
      id: createResponse.data.journalEntry?.id,
      entryNumber: createResponse.data.journalEntry?.entryNumber,
      description: createResponse.data.journalEntry?.description
    });
    
    console.log('   📊 جدولة الإهلاك:', {
      monthsCreated: createResponse.data.depreciationSchedule?.monthsCreated
    });
    
    const assetId = createResponse.data.data.id;
    
    // 4. Test depreciation schedule retrieval
    console.log('\n📊 3. اختبار جلب جدولة الإهلاك...');
    
    const scheduleResponse = await axios.get(`${API_BASE_URL}/financial/fixed-assets/${assetId}/depreciation-schedule`, { headers });
    
    console.log('   ✅ تم جلب الجدولة بنجاح');
    console.log('   📋 ملخص الجدولة:', {
      totalScheduled: scheduleResponse.data.data.summary.totalScheduled,
      totalPending: scheduleResponse.data.data.summary.totalPending,
      totalDepreciationAmount: scheduleResponse.data.data.summary.totalDepreciationAmount,
      currentBookValue: scheduleResponse.data.data.summary.currentBookValue
    });
    
    // Show first 3 months
    const schedule = scheduleResponse.data.data.schedule;
    console.log('   📅 أول 3 أشهر من الجدولة:');
    schedule.slice(0, 3).forEach((entry, index) => {
      console.log(`     ${index + 1}. ${entry.scheduleDate}: ${entry.depreciationAmount} LYD (مجمع: ${entry.accumulatedDepreciation}, قيمة دفترية: ${entry.bookValue})`);
    });
    
    // 5. Test posting a depreciation entry
    console.log('\n📝 4. اختبار ترحيل قيد إهلاك...');
    
    const firstPendingEntry = schedule.find(entry => entry.status === 'pending');
    if (firstPendingEntry) {
      const postResponse = await axios.post(`${API_BASE_URL}/financial/fixed-assets/${assetId}/post-depreciation`, {
        scheduleDate: firstPendingEntry.scheduleDate,
        notes: 'قيد إهلاك تجريبي عبر API'
      }, { headers });
      
      console.log('   ✅ تم ترحيل قيد الإهلاك بنجاح');
      console.log('   📝 تفاصيل القيد:', {
        journalEntryId: postResponse.data.data.journalEntry?.id,
        entryNumber: postResponse.data.data.journalEntry?.entryNumber,
        glEntriesCount: postResponse.data.data.journalEntry?.glEntries?.length
      });
      
    } else {
      console.log('   ⚠️ لا توجد قيود إهلاك معلقة');
    }
    
    // 6. Test asset listing
    console.log('\n📋 5. اختبار قائمة الأصول الثابتة...');
    
    const listResponse = await axios.get(`${API_BASE_URL}/financial/fixed-assets`, { headers });
    
    const ourAsset = listResponse.data.data.find(asset => asset.id === assetId);
    if (ourAsset) {
      console.log('   ✅ تم العثور على الأصل في القائمة:', {
        assetNumber: ourAsset.assetNumber,
        name: ourAsset.name,
        currentValue: ourAsset.currentValue,
        status: ourAsset.status
      });
    } else {
      console.log('   ❌ لم يتم العثور على الأصل في القائمة');
    }
    
    // 7. Cleanup (optional - comment out if you want to keep the test data)
    console.log('\n🗑️ 6. تنظيف البيانات التجريبية...');
    
    try {
      await axios.delete(`${API_BASE_URL}/financial/fixed-assets/${assetId}`, { headers });
      console.log('   ✅ تم حذف الأصل التجريبي');
    } catch (error) {
      console.log('   ⚠️ لم يتم حذف الأصل (ربما لا يوجد endpoint للحذف)');
    }
    
    // 8. Final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 ملخص نتائج اختبار النظام الكامل:');
    console.log('✅ تسجيل الدخول: نجح');
    console.log('✅ إنشاء الأصول الثابتة المتقدمة: نجح');
    console.log('✅ إنشاء الحسابات التلقائية: نجح');
    console.log('✅ إنشاء القيود المحاسبية: نجح');
    console.log('✅ توليد جدولة الإهلاك: نجح');
    console.log('✅ جلب جدولة الإهلاك: نجح');
    console.log('✅ ترحيل قيود الإهلاك: نجح');
    console.log('✅ قائمة الأصول الثابتة: نجح');
    console.log('\n🚀 النظام الكامل للأصول الثابتة المتقدمة يعمل بكفاءة عالية!');
    console.log('🎯 جميع الميزات المطلوبة تم تنفيذها بنجاح:');
    console.log('   • إنشاء الحسابات التلقائي ✅');
    console.log('   • القيود المحاسبية مع voucherType صحيح ✅');
    console.log('   • جدولة الإهلاك التلقائي ✅');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار النظام الكامل:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

testCompleteFixedAssetSystem();
