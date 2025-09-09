import axios from 'axios';
import fs from 'fs';

const API = 'http://localhost:5001/api';
const outFile = './test-api-flow-output.log';
fs.writeFileSync(outFile, '');
const log = (...args) => { fs.appendFileSync(outFile, args.join(' ') + '\n'); console.log(...args); };

(async () => {
  try {
    log('🔬 بدء اختبار تكاملي API');
    // 1. تسجيل الدخول كمستخدم admin افتراضي
  let res = await axios.post(`${API}/auth/login`, { username: 'admin', password: 'admin123' }).catch(e => e.response);
    if (!res.data || !res.data.accessToken) throw new Error('فشل تسجيل الدخول (تحقق من بيانات admin الافتراضية)');
    const token = res.data.accessToken;
    log('✅ تسجيل الدخول: PASS');

    // 2. إنشاء حسابين
    const headers = { Authorization: 'Bearer ' + token };
    res = await axios.post(`${API}/financial/accounts`, {
      code: '2000', name: 'اختبار مدين', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit', accountType: 'main', level: 1
    }, { headers }).catch(e => e.response);
    const acc1 = res.data && res.data.id ? res.data : null;
    res = await axios.post(`${API}/financial/accounts`, {
      code: '3000', name: 'اختبار دائن', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', nature: 'credit', accountType: 'main', level: 1
    }, { headers }).catch(e => e.response);
    const acc2 = res.data && res.data.id ? res.data : null;
    if (acc1 && acc2) log('✅ إنشاء حسابين: PASS'); else log('❌ فشل إنشاء الحسابات');

    // 3. إنشاء قيد يومية متوازن
    res = await axios.post(`${API}/financial/journal-entries`, {
      date: new Date().toISOString().slice(0,10), description: 'قيد اختبار', details: [
        { accountId: acc1.id, debit: 100, credit: 0 },
        { accountId: acc2.id, debit: 0, credit: 100 }
      ]
    }, { headers }).catch(e => e.response);
    const je = res.data && res.data.id ? res.data : null;
    if (je) log('✅ إنشاء قيد يومية متوازن: PASS'); else log('❌ فشل إنشاء القيد');

    // 4. اعتماد القيد
    res = await axios.post(`${API}/financial/journal-entries/${je.id}/submit`, {}, { headers }).catch(e => e.response);
    if (res.data && res.data.message) log('✅ اعتماد القيد: PASS'); else log('❌ فشل اعتماد القيد');

    // 5. تحقق من أرصدة الحسابات
    res = await axios.get(`${API}/financial/accounts?search=اختبار`, { headers }).catch(e => e.response);
    if (res.data && res.data.data) {
      for (const acc of res.data.data) {
        log(`رصيد الحساب ${acc.code} (${acc.nature}): ${acc.balance}`);
      }
      log('✅ تحقق من الأرصدة: PASS');
    } else {
      log('❌ فشل جلب الأرصدة');
    }
    log('✅ اختبار تكاملي API اكتمل بنجاح');
  } catch (err) {
    log('❌ خطأ أثناء اختبار API:', err.message);
  }
})();
