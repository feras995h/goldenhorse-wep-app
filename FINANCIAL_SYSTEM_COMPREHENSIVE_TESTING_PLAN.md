# 🧪 خطة الاختبار الشاملة للنظام المالي
## Golden Horse Shipping System - Comprehensive Testing Plan

---

## 📋 **نظرة عامة**

هذه الخطة تحتوي على اختبارات شاملة للنظام المالي لضمان جودة وموثوقية جميع المكونات والوظائف.

---

## 🎯 **أهداف الاختبار**

1. **التحقق من صحة العمليات المحاسبية**
2. **اختبار التكامل بين المكونات**
3. **التأكد من أمان النظام**
4. **اختبار الأداء تحت الضغط**
5. **التحقق من دقة التقارير المالية**

---

## 🔧 **اختبارات الوحدة (Unit Tests)**

### **1. اختبار نماذج البيانات**

#### **اختبار Account Model:**
```javascript
// test/models/Account.test.js
import { expect } from 'chai';
import models from '../../server/src/models/index.js';

const { Account } = models;

describe('Account Model', () => {
  beforeEach(async () => {
    await Account.destroy({ where: {}, force: true });
  });

  describe('Account Creation', () => {
    it('should create a valid account', async () => {
      const accountData = {
        code: '1001',
        name: 'النقدية',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        nature: 'debit'
      };

      const account = await Account.create(accountData);
      
      expect(account.code).to.equal('1001');
      expect(account.name).to.equal('النقدية');
      expect(account.type).to.equal('asset');
      expect(account.balance).to.equal(0);
    });

    it('should reject duplicate account codes', async () => {
      const accountData = {
        code: '1001',
        name: 'النقدية',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet'
      };

      await Account.create(accountData);
      
      try {
        await Account.create(accountData);
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeUniqueConstraintError');
      }
    });

    it('should validate required fields', async () => {
      try {
        await Account.create({});
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
  });

  describe('Account Methods', () => {
    it('should calculate balance correctly', async () => {
      const account = await Account.create({
        code: '1001',
        name: 'النقدية',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        balance: 1000.50
      });

      expect(account.getBalance()).to.equal(1000.50);
    });

    it('should check if account is debit nature', async () => {
      const account = await Account.create({
        code: '1001',
        name: 'النقدية',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        nature: 'debit'
      });

      expect(account.isDebitNature()).to.be.true;
    });
  });
});
```

#### **اختبار JournalEntry Model:**
```javascript
// test/models/JournalEntry.test.js
describe('JournalEntry Model', () => {
  describe('Journal Entry Creation', () => {
    it('should create a balanced journal entry', async () => {
      const entryData = {
        entryNumber: 'JE001',
        date: '2025-01-01',
        totalDebit: 1000,
        totalCredit: 1000,
        description: 'Test entry'
      };

      const entry = await JournalEntry.create(entryData);
      
      expect(entry.entryNumber).to.equal('JE001');
      expect(entry.getTotalDebit()).to.equal(1000);
      expect(entry.getTotalCredit()).to.equal(1000);
    });

    it('should reject unbalanced journal entry', async () => {
      const entryData = {
        entryNumber: 'JE002',
        date: '2025-01-01',
        totalDebit: 1000,
        totalCredit: 500,
        description: 'Unbalanced entry'
      };

      try {
        await JournalEntry.create(entryData);
        expect.fail('Should have thrown balance validation error');
      } catch (error) {
        expect(error.message).to.include('Total debits must equal total credits');
      }
    });
  });
});
```

### **2. اختبار APIs المالية**

#### **اختبار Financial APIs:**
```javascript
// test/routes/financial.test.js
import request from 'supertest';
import app from '../../server/src/app.js';

describe('Financial APIs', () => {
  let authToken;
  let testAccount;

  beforeEach(async () => {
    // إعداد المصادقة
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('GET /api/financial/accounts', () => {
    it('should return accounts list', async () => {
      const response = await request(app)
        .get('/api/financial/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/financial/accounts')
        .expect(401);
    });
  });

  describe('POST /api/financial/accounts', () => {
    it('should create new account', async () => {
      const accountData = {
        code: '1001',
        name: 'النقدية',
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet'
      };

      const response = await request(app)
        .post('/api/financial/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(accountData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.data.code).to.equal('1001');
      expect(response.body.data.name).to.equal('النقدية');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/financial/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).to.be.false;
    });
  });

  describe('GET /api/financial/summary', () => {
    it('should return financial summary', async () => {
      const response = await request(app)
        .get('/api/financial/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('totalAssets');
      expect(response.body).to.have.property('totalLiabilities');
      expect(response.body).to.have.property('totalEquity');
      expect(response.body).to.have.property('netProfit');
    });

    it('should have balanced accounting equation', async () => {
      const response = await request(app)
        .get('/api/financial/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { totalAssets, totalLiabilities, totalEquity } = response.body;
      const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
      
      expect(difference).to.be.lessThan(0.01);
    });
  });
});
```

---

## 🔗 **اختبارات التكامل (Integration Tests)**

### **1. اختبار التكامل بين المبيعات والمحاسبة**

```javascript
// test/integration/salesAccounting.test.js
describe('Sales-Accounting Integration', () => {
  let customer, salesAccount, taxAccount;

  beforeEach(async () => {
    // إعداد البيانات الأساسية
    customer = await Customer.create({
      name: 'عميل تجريبي',
      email: 'test@customer.com'
    });

    salesAccount = await Account.create({
      code: '4001',
      name: 'مبيعات',
      type: 'revenue',
      rootType: 'Income',
      reportType: 'Profit and Loss'
    });

    taxAccount = await Account.create({
      code: '2301',
      name: 'ضريبة القيمة المضافة',
      type: 'liability',
      rootType: 'Liability',
      reportType: 'Balance Sheet'
    });
  });

  it('should create journal entry when sales invoice is created', async () => {
    const invoiceData = {
      customerId: customer.id,
      invoiceNumber: 'INV001',
      date: '2025-01-01',
      subtotal: 1000,
      taxAmount: 130,
      total: 1130
    };

    const invoice = await SalesInvoice.create(invoiceData);
    const journalEntry = await invoice.createJournalEntry('user-id');

    expect(journalEntry).to.not.be.null;
    expect(journalEntry.totalDebit).to.equal(1130);
    expect(journalEntry.totalCredit).to.equal(1130);

    // التحقق من تفاصيل القيد
    const details = await JournalEntryDetail.findAll({
      where: { journalEntryId: journalEntry.id }
    });

    expect(details).to.have.length(3); // عميل، مبيعات، ضريبة
  });

  it('should update customer balance when invoice is created', async () => {
    const initialBalance = customer.balance;
    
    const invoiceData = {
      customerId: customer.id,
      invoiceNumber: 'INV002',
      date: '2025-01-01',
      total: 1000
    };

    await SalesInvoice.create(invoiceData);
    await customer.reload();

    expect(customer.balance).to.equal(initialBalance + 1000);
  });

  it('should create payment and update balances', async () => {
    // إنشاء فاتورة أولاً
    const invoice = await SalesInvoice.create({
      customerId: customer.id,
      invoiceNumber: 'INV003',
      date: '2025-01-01',
      total: 1000
    });

    // إنشاء دفعة
    const paymentData = {
      customerId: customer.id,
      amount: 500,
      date: '2025-01-02',
      paymentMethod: 'cash'
    };

    const payment = await Payment.create(paymentData);
    await payment.update({ status: 'completed' });

    // التحقق من تحديث رصيد العميل
    await customer.reload();
    expect(customer.balance).to.equal(500); // 1000 - 500
  });
});
```

### **2. اختبار نظام الأرصدة الافتتاحية**

```javascript
// test/integration/openingBalances.test.js
describe('Opening Balances System', () => {
  it('should set opening balances correctly', async () => {
    const account = await Account.create({
      code: '1001',
      name: 'النقدية',
      type: 'asset',
      rootType: 'Asset',
      reportType: 'Balance Sheet'
    });

    const openingBalance = 5000;
    
    // إنشاء قيد افتتاحي
    const journalEntry = await JournalEntry.create({
      entryNumber: 'OB001',
      date: '2025-01-01',
      totalDebit: openingBalance,
      totalCredit: openingBalance,
      description: 'Opening Balance',
      isOpeningEntry: true
    });

    await JournalEntryDetail.create({
      journalEntryId: journalEntry.id,
      accountId: account.id,
      debit: openingBalance,
      credit: 0,
      description: 'Opening balance for cash'
    });

    // التحقق من الرصيد
    const calculatedBalance = await account.calculateBalance();
    expect(calculatedBalance).to.equal(openingBalance);
  });
});
```

---

## 🛡️ **اختبارات الأمان (Security Tests)**

### **1. اختبار المصادقة والتفويض**

```javascript
// test/security/authentication.test.js
describe('Authentication & Authorization', () => {
  describe('Financial Access Control', () => {
    it('should deny access without token', async () => {
      await request(app)
        .get('/api/financial/accounts')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app)
        .get('/api/financial/accounts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should deny access without financial permissions', async () => {
      // إنشاء مستخدم بدون صلاحيات مالية
      const user = await User.create({
        email: 'limited@test.com',
        password: 'password123',
        hasFinancialAccess: false
      });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

      await request(app)
        .get('/api/financial/accounts')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Data Validation', () => {
    it('should prevent SQL injection in account search', async () => {
      const maliciousInput = "'; DROP TABLE accounts; --";
      
      const response = await request(app)
        .get('/api/financial/accounts')
        .query({ search: maliciousInput })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // التأكد من أن الجداول لا تزال موجودة
      const accountsCount = await Account.count();
      expect(accountsCount).to.be.greaterThan(0);
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        code: '<script>alert("xss")</script>',
        name: 'Test Account',
        type: 'asset'
      };

      const response = await request(app)
        .post('/api/financial/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).to.be.false;
    });
  });
});
```

---

## ⚡ **اختبارات الأداء (Performance Tests)**

### **1. اختبار الأداء تحت الضغط**

```javascript
// test/performance/loadTest.js
describe('Performance Tests', () => {
  describe('Financial Summary Calculation', () => {
    it('should calculate summary within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/financial/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.lessThan(2000); // أقل من ثانيتين
    });

    it('should handle concurrent requests', async () => {
      const promises = [];
      const concurrentRequests = 10;

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/financial/summary')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).to.equal(200);
      });
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large trial balance report', async () => {
      // إنشاء عدد كبير من الحسابات للاختبار
      const accounts = [];
      for (let i = 0; i < 1000; i++) {
        accounts.push({
          code: `TEST${i.toString().padStart(4, '0')}`,
          name: `Test Account ${i}`,
          type: 'asset',
          rootType: 'Asset',
          reportType: 'Balance Sheet'
        });
      }

      await Account.bulkCreate(accounts);

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/financial/reports/trial-balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.lessThan(5000); // أقل من 5 ثوانٍ
      expect(response.body.data.accounts).to.be.an('array');
    });
  });
});
```

---

## 📊 **اختبارات دقة التقارير (Report Accuracy Tests)**

### **1. اختبار ميزان المراجعة**

```javascript
// test/reports/trialBalance.test.js
describe('Trial Balance Report', () => {
  it('should have balanced totals', async () => {
    // إنشاء بيانات تجريبية
    await createTestData();

    const response = await request(app)
      .get('/api/financial/reports/trial-balance')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const { totals } = response.body.data;
    
    expect(Math.abs(totals.totalDebit - totals.totalCredit)).to.be.lessThan(0.01);
  });

  it('should match GL entries', async () => {
    const account = await Account.create({
      code: '1001',
      name: 'النقدية',
      type: 'asset'
    });

    // إنشاء قيود GL
    await GLEntry.create({
      accountId: account.id,
      debit: 1000,
      credit: 0,
      postingDate: '2025-01-01'
    });

    await GLEntry.create({
      accountId: account.id,
      debit: 0,
      credit: 300,
      postingDate: '2025-01-02'
    });

    const response = await request(app)
      .get('/api/financial/reports/trial-balance')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const accountInReport = response.body.data.accounts.find(
      acc => acc.id === account.id
    );

    expect(accountInReport.balance).to.equal(700); // 1000 - 300
  });
});
```

---

## 🚀 **تشغيل الاختبارات**

### **1. إعداد بيئة الاختبار**

```bash
# تثبيت أدوات الاختبار
npm install --save-dev mocha chai supertest sinon

# إنشاء قاعدة بيانات للاختبار
createdb golden_horse_test

# تشغيل الاختبارات
npm test
```

### **2. سكريبت package.json**

```json
{
  "scripts": {
    "test": "NODE_ENV=test mocha test/**/*.test.js --timeout 10000",
    "test:unit": "mocha test/models/*.test.js",
    "test:integration": "mocha test/integration/*.test.js",
    "test:security": "mocha test/security/*.test.js",
    "test:performance": "mocha test/performance/*.test.js",
    "test:coverage": "nyc npm test"
  }
}
```

### **3. تقرير التغطية**

```bash
# تشغيل اختبار التغطية
npm run test:coverage

# الهدف: تغطية أكثر من 90%
```

---

## ✅ **معايير النجاح**

### **المعايير الوظيفية:**
- ✅ جميع الاختبارات تمر بنجاح
- ✅ تغطية الكود أكثر من 90%
- ✅ معادلة المحاسبة متوازنة دائماً
- ✅ دقة التقارير المالية 100%

### **معايير الأداء:**
- ✅ وقت استجابة أقل من 2 ثانية للتقارير
- ✅ دعم 100 مستخدم متزامن
- ✅ معالجة 10,000 معاملة في الدقيقة

### **معايير الأمان:**
- ✅ مقاومة هجمات SQL Injection
- ✅ مقاومة هجمات XSS
- ✅ تشفير البيانات الحساسة
- ✅ تدقيق شامل للعمليات

---

**تاريخ الإنشاء:** 2025-09-20  
**المؤلف:** Augment Agent - Financial Systems Specialist  
**الحالة:** جاهز للتنفيذ ✅
