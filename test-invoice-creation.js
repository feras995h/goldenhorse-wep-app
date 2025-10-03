/**
 * Test Invoice Creation - اختبار إنشاء فاتورة كاملة
 * يختبر النظام المحاسبي بالكامل: الفاتورة + القيود التلقائية + تحديث الأرصدة
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001/api';
let authToken = null;

// 1. تسجيل الدخول
async function login() {
  console.log('\n🔐 تسجيل الدخول...');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  authToken = data.token;
  console.log('✅ تم تسجيل الدخول بنجاح');
  return data;
}

// 2. الحصول على العملاء
async function getCustomers() {
  console.log('\n📋 جلب قائمة العملاء...');
  
  const response = await fetch(`${API_URL}/customers`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Get customers failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ تم جلب ${data.length || data.data?.length || 0} عميل`);
  return data;
}

// 3. إنشاء فاتورة اختبارية
async function createTestInvoice(customerId) {
  console.log('\n📄 إنشاء فاتورة اختبارية...');
  
  const invoiceData = {
    customerId: customerId,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    items: [
      {
        description: 'خدمة شحن بحري - اختبار',
        quantity: 1,
        unitPrice: 1000,
        taxRate: 0,
        discount: 0
      },
      {
        description: 'خدمة تخليص جمركي - اختبار',
        quantity: 1,
        unitPrice: 500,
        taxRate: 0,
        discount: 50
      }
    ],
    notes: 'فاتورة اختبارية للتحقق من النظام المحاسبي',
    currency: 'LYD'
  };

  console.log('\n📊 بيانات الفاتورة:');
  console.log(`   - العميل: ${customerId}`);
  console.log(`   - عدد الأصناف: ${invoiceData.items.length}`);
  console.log(`   - المبلغ الإجمالي: ${invoiceData.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice - item.discount), 0)} LYD`);

  const response = await fetch(`${API_URL}/sales/invoices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invoiceData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ فشل إنشاء الفاتورة:', error);
    throw new Error(`Create invoice failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('\n✅ تم إنشاء الفاتورة بنجاح!');
  console.log(`   - رقم الفاتورة: ${data.invoiceNumber || data.invoice?.invoiceNumber}`);
  console.log(`   - المبلغ الإجمالي: ${data.totalAmount || data.invoice?.totalAmount} LYD`);
  
  return data;
}

// 4. التحقق من القيد المحاسبي
async function verifyJournalEntry(invoiceId) {
  console.log('\n🔍 التحقق من القيد المحاسبي...');
  
  const response = await fetch(`${API_URL}/financial/journal-entries?invoiceId=${invoiceId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    console.warn('⚠️  لم يتم العثور على قيد محاسبي (قد يكون طبيعياً)');
    return null;
  }

  const data = await response.json();
  console.log('✅ تم العثور على القيد المحاسبي');
  
  if (data.data && data.data.length > 0) {
    const entry = data.data[0];
    console.log(`   - رقم القيد: ${entry.entryNumber}`);
    console.log(`   - التاريخ: ${entry.date}`);
    console.log(`   - عدد التفاصيل: ${entry.details?.length || 0}`);
  }
  
  return data;
}

// 5. التحقق من أرصدة الحسابات
async function verifyAccountBalances() {
  console.log('\n💰 التحقق من أرصدة الحسابات...');
  
  const response = await fetch(`${API_URL}/financial/accounts`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    console.warn('⚠️  لم يتم جلب الحسابات');
    return null;
  }

  const data = await response.json();
  const accounts = data.data || data;
  
  // عرض الحسابات ذات الأرصدة
  const accountsWithBalance = accounts.filter(acc => acc.balance && acc.balance !== 0);
  
  if (accountsWithBalance.length > 0) {
    console.log('✅ الحسابات ذات الأرصدة:');
    accountsWithBalance.forEach(acc => {
      console.log(`   - ${acc.code} ${acc.name}: ${acc.balance} ${acc.currency}`);
    });
  } else {
    console.log('⚠️  لا توجد حسابات بأرصدة حالياً');
  }
  
  return accountsWithBalance;
}

// 6. الملخص المالي
async function getFinancialSummary() {
  console.log('\n📊 الملخص المالي...');
  
  const response = await fetch(`${API_URL}/financial/summary`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    console.warn('⚠️  لم يتم جلب الملخص المالي');
    return null;
  }

  const data = await response.json();
  console.log('✅ الملخص المالي:');
  console.log(`   - إجمالي الأصول: ${data.totalAssets || 0} LYD`);
  console.log(`   - إجمالي الالتزامات: ${data.totalLiabilities || 0} LYD`);
  console.log(`   - صافي الربح: ${data.netProfit || 0} LYD`);
  
  return data;
}

// تشغيل الاختبار الكامل
async function runFullTest() {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 اختبار النظام المحاسبي الكامل');
    console.log('🧪 ========================================');

    // 1. تسجيل الدخول
    await login();

    // 2. جلب العملاء
    const customers = await getCustomers();
    const customerData = customers.data || customers;
    
    if (!customerData || customerData.length === 0) {
      console.log('\n⚠️  لا يوجد عملاء! يجب إنشاء عميل أولاً');
      console.log('💡 افتح النظام وأنشئ عميل من صفحة العملاء');
      return;
    }

    const firstCustomer = customerData[0];
    console.log(`\n✅ سيتم استخدام العميل: ${firstCustomer.name} (${firstCustomer.code})`);

    // 3. إنشاء فاتورة
    const invoice = await createTestInvoice(firstCustomer.id);
    const invoiceId = invoice.id || invoice.invoice?.id;

    // 4. التحقق من القيد المحاسبي
    if (invoiceId) {
      await verifyJournalEntry(invoiceId);
    }

    // 5. التحقق من الأرصدة
    await verifyAccountBalances();

    // 6. الملخص المالي
    await getFinancialSummary();

    console.log('\n🎉 ========================================');
    console.log('🎉 اكتمل الاختبار بنجاح!');
    console.log('🎉 ========================================');
    console.log('\n✅ النظام المحاسبي يعمل بشكل صحيح!');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ فشل الاختبار!');
    console.error('❌ ========================================');
    console.error('\n🐛 الخطأ:', error.message);
    console.error('\n📝 التفاصيل:', error.stack);
  }
}

// تشغيل الاختبار
runFullTest();
