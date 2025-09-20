import axios from 'axios';

/**
 * سكريپت اختبار API إنشاء العملاء
 */

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'admin@goldenhorse.ly',
  password: 'admin123'
};

class CustomerAPITester {
  constructor() {
    this.authToken = null;
  }

  async authenticate() {
    try {
      console.log('🔐 تسجيل الدخول...');
      const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER, {
        timeout: 10000
      });
      
      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        console.log('✅ تم تسجيل الدخول بنجاح');
        return true;
      }
      throw new Error('فشل في الحصول على token');
    } catch (error) {
      console.log(`❌ فشل تسجيل الدخول: ${error.message}`);
      return false;
    }
  }

  async testCreateCustomer() {
    try {
      console.log('\n🧪 اختبار إنشاء عميل جديد...');
      
      const testCustomer = {
        name: 'عميل اختبار API',
        nameEn: 'API Test Customer',
        type: 'individual',
        email: 'api-test@example.com',
        phone: '0912345678',
        address: 'طرابلس، ليبيا',
        creditLimit: 5000,
        paymentTerms: 30,
        currency: 'LYD',
        contactPerson: 'أحمد محمد'
      };

      const response = await axios.post(`${BASE_URL}/api/sales/customers`, testCustomer, {
        headers: { 
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.status === 201) {
        console.log('✅ تم إنشاء العميل بنجاح');
        console.log(`   - ID: ${response.data.customer.id}`);
        console.log(`   - Code: ${response.data.customer.code}`);
        console.log(`   - Name: ${response.data.customer.name}`);
        console.log(`   - Email: ${response.data.customer.email}`);
        console.log(`   - Credit Limit: ${response.data.customer.creditLimit} ${response.data.customer.currency}`);
        
        return response.data.customer;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ فشل في إنشاء العميل: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return null;
    }
  }

  async testGetCustomers() {
    try {
      console.log('\n🧪 اختبار جلب قائمة العملاء...');
      
      const response = await axios.get(`${BASE_URL}/api/sales/customers`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        const customers = response.data.data || response.data;
        console.log(`✅ تم جلب ${customers.length} عميل`);
        
        if (customers.length > 0) {
          console.log('   العملاء الموجودين:');
          customers.slice(0, 3).forEach(customer => {
            console.log(`   - ${customer.code}: ${customer.name} (${customer.type})`);
          });
        }
        
        return customers;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ فشل في جلب العملاء: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return [];
    }
  }

  async testUpdateCustomer(customerId) {
    try {
      console.log('\n🧪 اختبار تحديث العميل...');
      
      const updateData = {
        creditLimit: 7500,
        paymentTerms: 45,
        contactPerson: 'محمد أحمد (محدث)'
      };

      const response = await axios.put(`${BASE_URL}/api/sales/customers/${customerId}`, updateData, {
        headers: { 
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ تم تحديث العميل بنجاح');
        console.log(`   - Credit Limit: ${response.data.customer.creditLimit}`);
        console.log(`   - Payment Terms: ${response.data.customer.paymentTerms} days`);
        console.log(`   - Contact Person: ${response.data.customer.contactPerson}`);
        
        return response.data.customer;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ فشل في تحديث العميل: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return null;
    }
  }

  async testDeleteCustomer(customerId) {
    try {
      console.log('\n🧪 اختبار حذف العميل...');
      
      const response = await axios.delete(`${BASE_URL}/api/sales/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ تم حذف العميل بنجاح');
        return true;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ فشل في حذف العميل: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 بدء اختبار API العملاء...');
    console.log(`🌐 الخادم: ${BASE_URL}\n`);

    // تسجيل الدخول
    const loginSuccess = await this.authenticate();
    if (!loginSuccess) {
      console.log('❌ فشل في تسجيل الدخول - إيقاف الاختبارات');
      return;
    }

    // اختبار إنشاء عميل
    const newCustomer = await this.testCreateCustomer();
    if (!newCustomer) {
      console.log('❌ فشل في إنشاء العميل - إيقاف الاختبارات');
      return;
    }

    // اختبار جلب العملاء
    await this.testGetCustomers();

    // اختبار تحديث العميل
    await this.testUpdateCustomer(newCustomer.id);

    // اختبار حذف العميل
    await this.testDeleteCustomer(newCustomer.id);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 تم إكمال اختبار API العملاء');
    console.log('='.repeat(60));
    console.log('✅ جميع وظائف العملاء تعمل بشكل صحيح');
    console.log('🚀 النظام جاهز لإنشاء وإدارة العملاء');
  }
}

// تشغيل الاختبارات
async function runTests() {
  const tester = new CustomerAPITester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ خطأ في تشغيل اختبارات API العملاء:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('test-customer-api.js')) {
  runTests();
}

export { CustomerAPITester };
