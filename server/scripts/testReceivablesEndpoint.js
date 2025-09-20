import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5001/api';

// Test the receivables details endpoint
async function testReceivablesEndpoint() {
  try {
    console.log('🧪 اختبار endpoint تفاصيل المدينون...\n');

    // Test without authentication first (should fail)
    console.log('1️⃣ اختبار بدون مصادقة (يجب أن يفشل):');
    try {
      const response = await fetch(`${API_BASE}/financial/receivables-details?period=today&limit=10`);
      const data = await response.json();
      console.log('   ❌ الاستجابة:', data.message || 'غير متوقع');
    } catch (error) {
      console.log('   ✅ فشل كما هو متوقع:', error.message);
    }

    console.log('\n2️⃣ اختبار مع مصادقة مؤقتة (تجاوز المصادقة):');
    
    // Create a simple test by calling the endpoint directly
    // We'll modify the endpoint temporarily to bypass auth for testing
    
    console.log('   📡 استدعاء endpoint مباشرة...');
    
    // Test different periods
    const periods = ['today', 'week', 'month'];
    
    for (const period of periods) {
      console.log(`\n   🔍 اختبار فترة: ${period}`);
      
      try {
        const response = await fetch(`${API_BASE}/financial/receivables-details?period=${period}&limit=5`, {
          headers: {
            'Content-Type': 'application/json',
            // We'll need to add a test token or bypass auth
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ نجح الاستدعاء للفترة ${period}:`);
          console.log(`      📊 عدد السجلات: ${data.total || 0}`);
          console.log(`      💰 إجمالي المدين: ${data.summary?.totalDebit || 0} د.ل`);
          console.log(`      💰 إجمالي الدائن: ${data.summary?.totalCredit || 0} د.ل`);
          console.log(`      📈 صافي الرصيد: ${data.summary?.netBalance || 0} د.ل`);
          
          if (data.data && data.data.length > 0) {
            console.log(`      📋 أول سجل:`);
            const firstRecord = data.data[0];
            console.log(`         التاريخ: ${firstRecord.date}`);
            console.log(`         الحساب: ${firstRecord.account?.code} - ${firstRecord.account?.name}`);
            console.log(`         الوصف: ${firstRecord.description}`);
            console.log(`         نوع السند: ${firstRecord.voucherType}`);
            console.log(`         مدين: ${firstRecord.debit} د.ل`);
            console.log(`         دائن: ${firstRecord.credit} د.ل`);
          }
        } else {
          const errorData = await response.json();
          console.log(`   ❌ فشل للفترة ${period}:`, errorData.message);
        }
      } catch (error) {
        console.log(`   ❌ خطأ في الفترة ${period}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// Run the test
testReceivablesEndpoint();
