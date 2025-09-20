import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      ...testConfig,
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        ...testConfig.headers,
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 اختبار تسجيل الدخول...');
  const result = await makeRequest('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    return true;
  } else {
    console.log('❌ فشل تسجيل الدخول:', result.error);
    return false;
  }
};

const testShipmentStatusUpdate = async () => {
  console.log('\n📦 اختبار تحديث حالة الشحنة...');
  
  // أولاً، احصل على قائمة الشحنات
  const shipmentsResult = await makeRequest('GET', '/sales/shipments?limit=1');
  if (!shipmentsResult.success || !shipmentsResult.data.data?.length) {
    console.log('❌ لا توجد شحنات للاختبار');
    return false;
  }
  
  const shipment = shipmentsResult.data.data[0];
  console.log(`📋 اختبار الشحنة: ${shipment.trackingNumber}`);
  
  // اختبار إنشاء حركة جديدة للشحنة
  const movementData = {
    type: 'status_update',
    newStatus: 'in_transit',
    location: 'مطار طرابلس الدولي',
    notes: 'اختبار تحديث حالة الشحنة من النظام'
  };
  
  const result = await makeRequest('POST', `/sales/shipments/${shipment.id}/movements`, movementData);
  
  if (result.success) {
    console.log('✅ تم تحديث حالة الشحنة بنجاح');
    console.log(`📍 الحالة الجديدة: ${result.data.movement?.newStatus}`);
    return true;
  } else {
    console.log('❌ فشل تحديث حالة الشحنة:', result.error);
    return false;
  }
};

const testSalesReports = async () => {
  console.log('\n📊 اختبار تقارير المبيعات...');
  
  // اختبار التقرير الملخص
  const summaryResult = await makeRequest('GET', '/sales/reports?reportType=summary');
  if (summaryResult.success) {
    console.log('✅ تقرير الملخص يعمل بنجاح');
    console.log(`📈 إجمالي المبيعات: ${summaryResult.data.summary?.totalAmount || 0}`);
  } else {
    console.log('❌ فشل تقرير الملخص:', summaryResult.error);
    return false;
  }
  
  // اختبار التقرير المفصل
  const detailedResult = await makeRequest('GET', '/sales/reports?reportType=detailed&limit=5');
  if (detailedResult.success) {
    console.log('✅ التقرير المفصل يعمل بنجاح');
    console.log(`📋 عدد الفواتير: ${detailedResult.data.data?.length || 0}`);
  } else {
    console.log('❌ فشل التقرير المفصل:', detailedResult.error);
    return false;
  }
  
  // اختبار تقرير العملاء
  const customerResult = await makeRequest('GET', '/sales/reports?reportType=customer');
  if (customerResult.success) {
    console.log('✅ تقرير العملاء يعمل بنجاح');
    console.log(`👥 عدد العملاء: ${customerResult.data.data?.length || 0}`);
  } else {
    console.log('❌ فشل تقرير العملاء:', customerResult.error);
    return false;
  }
  
  return true;
};

const testInvoiceDisplay = async () => {
  console.log('\n🧾 اختبار عرض بيانات الفواتير...');
  
  // احصل على قائمة الفواتير
  const invoicesResult = await makeRequest('GET', '/sales/sales-invoices?limit=5');
  if (!invoicesResult.success) {
    console.log('❌ فشل جلب الفواتير:', invoicesResult.error);
    return false;
  }
  
  const invoices = invoicesResult.data.data || [];
  if (invoices.length === 0) {
    console.log('⚠️ لا توجد فواتير للاختبار');
    return true;
  }
  
  console.log('✅ تم جلب الفواتير بنجاح');
  console.log(`📋 عدد الفواتير: ${invoices.length}`);
  
  // اختبار عرض تفاصيل فاتورة واحدة
  const invoice = invoices[0];
  const invoiceResult = await makeRequest('GET', `/sales/sales-invoices/${invoice.id}`);
  
  if (invoiceResult.success) {
    console.log('✅ تم جلب تفاصيل الفاتورة بنجاح');
    console.log(`💰 المبلغ الإجمالي: ${invoiceResult.data.total} ${invoiceResult.data.currency}`);
    console.log(`📅 التاريخ: ${new Date(invoiceResult.data.date).toLocaleDateString('ar-SA')}`);
    console.log(`📊 الحالة: ${invoiceResult.data.status}`);
    console.log(`💳 حالة الدفع: ${invoiceResult.data.paymentStatus}`);
    return true;
  } else {
    console.log('❌ فشل جلب تفاصيل الفاتورة:', invoiceResult.error);
    return false;
  }
};

const testReturnInvoice = async () => {
  console.log('\n🔄 اختبار إنشاء فاتورة مرتجع...');
  
  // احصل على عميل وفاتورة للاختبار
  const customersResult = await makeRequest('GET', '/sales/customers?limit=1');
  if (!customersResult.success || !customersResult.data.data?.length) {
    console.log('❌ لا يوجد عملاء للاختبار');
    return false;
  }
  
  const customer = customersResult.data.data[0];
  
  // احصل على فاتورة للاختبار
  const invoicesResult = await makeRequest('GET', '/sales/sales-invoices?limit=1');
  let originalInvoiceId = null;
  if (invoicesResult.success && invoicesResult.data.data?.length > 0) {
    originalInvoiceId = invoicesResult.data.data[0].id;
  }
  
  // إنشاء فاتورة مرتجع
  const returnData = {
    customerId: customer.id,
    originalInvoiceId: originalInvoiceId,
    date: new Date().toISOString().split('T')[0],
    reason: 'اختبار إنشاء فاتورة مرتجع',
    subtotal: 100,
    taxAmount: 13,
    total: 113,
    notes: 'فاتورة مرتجع تجريبية للاختبار'
  };
  
  const result = await makeRequest('POST', '/sales/returns', returnData);
  
  if (result.success) {
    console.log('✅ تم إنشاء فاتورة المرتجع بنجاح');
    console.log(`🔢 رقم المرتجع: ${result.data.salesReturn?.returnNumber}`);
    console.log(`💰 المبلغ: ${result.data.salesReturn?.total}`);
    return true;
  } else {
    console.log('❌ فشل إنشاء فاتورة المرتجع:', result.error);
    return false;
  }
};

// تشغيل جميع الاختبارات
const runAllTests = async () => {
  console.log('🚀 بدء اختبار إصلاحات لوحة المبيعات...\n');
  
  const results = {
    login: false,
    shipmentStatus: false,
    salesReports: false,
    invoiceDisplay: false,
    returnInvoice: false
  };
  
  // اختبار تسجيل الدخول أولاً
  results.login = await testLogin();
  if (!results.login) {
    console.log('\n❌ فشل تسجيل الدخول - توقف الاختبار');
    return;
  }
  
  // تشغيل باقي الاختبارات
  results.shipmentStatus = await testShipmentStatusUpdate();
  results.salesReports = await testSalesReports();
  results.invoiceDisplay = await testInvoiceDisplay();
  results.returnInvoice = await testReturnInvoice();
  
  // عرض النتائج النهائية
  console.log('\n📋 ملخص نتائج الاختبار:');
  console.log('================================');
  console.log(`🔐 تسجيل الدخول: ${results.login ? '✅ نجح' : '❌ فشل'}`);
  console.log(`📦 تحديث حالة الشحنة: ${results.shipmentStatus ? '✅ نجح' : '❌ فشل'}`);
  console.log(`📊 تقارير المبيعات: ${results.salesReports ? '✅ نجح' : '❌ فشل'}`);
  console.log(`🧾 عرض بيانات الفواتير: ${results.invoiceDisplay ? '✅ نجح' : '❌ فشل'}`);
  console.log(`🔄 إنشاء فاتورة مرتجع: ${results.returnInvoice ? '✅ نجح' : '❌ فشل'}`);
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 معدل النجاح: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 جميع الاختبارات نجحت! لوحة المبيعات تعمل بشكل مثالي!');
  } else {
    console.log('\n⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  }
};

// تشغيل الاختبارات
console.log('🔧 بدء تشغيل اختبارات لوحة المبيعات...');
runAllTests().catch((error) => {
  console.error('❌ خطأ في تشغيل الاختبارات:', error);
});
