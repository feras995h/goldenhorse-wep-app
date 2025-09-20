import {
  formatNumber,
  formatCurrencyAmount,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  safeParseNumber,
  isValidNumber,
  formatFinancialResponse,
  formatFinancialArray
} from '../src/utils/formatters.js';

/**
 * Test script for the new number formatting system
 * Tests all edge cases and ensures proper handling of invalid values
 */

console.log('🧪 اختبار نظام تنسيق الأرقام والعملات الجديد');
console.log('='.repeat(60));

// Test data with various edge cases
const testValues = [
  1234.56,
  1234,
  0,
  0.1,
  0.01,
  -1234.56,
  null,
  undefined,
  '',
  'invalid',
  NaN,
  Infinity,
  -Infinity,
  '1234.56',
  '1,234.56',
  'ليس رقمًا',
  1000000,
  1000000000,
  0.001
];

console.log('\n📊 1. اختبار safeParseNumber:');
console.log('-'.repeat(40));
testValues.forEach(value => {
  const parsed = safeParseNumber(value);
  const isValid = isValidNumber(value);
  console.log(`${String(value).padEnd(15)} → ${String(parsed).padEnd(10)} (${isValid ? '✅' : '❌'})`);
});

console.log('\n💰 2. اختبار formatCurrencyAmount:');
console.log('-'.repeat(40));
testValues.forEach(value => {
  const formatted = formatCurrencyAmount(value);
  console.log(`${String(value).padEnd(15)} → ${formatted}`);
});

console.log('\n💱 3. اختبار formatCurrency:');
console.log('-'.repeat(40));
const currencies = ['LYD', 'USD', 'EUR'];
[1234.56, 0, -500.25].forEach(value => {
  currencies.forEach(currency => {
    const formatted = formatCurrency(value, currency);
    console.log(`${String(value).padEnd(10)} ${currency} → ${formatted}`);
  });
});

console.log('\n📈 4. اختبار formatPercentage:');
console.log('-'.repeat(40));
[25.5, 0, 100, 0.1, -5.25].forEach(value => {
  const formatted = formatPercentage(value);
  console.log(`${String(value).padEnd(10)} → ${formatted}`);
});

console.log('\n🔢 5. اختبار formatCompactNumber:');
console.log('-'.repeat(40));
[1234, 12345, 123456, 1234567, 12345678, 123456789].forEach(value => {
  const formatted = formatCompactNumber(value);
  console.log(`${String(value).padEnd(12)} → ${formatted}`);
});

console.log('\n💼 6. اختبار formatFinancialResponse:');
console.log('-'.repeat(40));
const sampleData = {
  id: '123',
  name: 'عميل تجريبي',
  amount: 1234.56,
  balance: null,
  total: 'invalid',
  credit: 0,
  debit: 5000.25,
  description: 'وصف تجريبي'
};

const formattedData = formatFinancialResponse(sampleData);
console.log('البيانات الأصلية:', JSON.stringify(sampleData, null, 2));
console.log('البيانات المنسقة:', JSON.stringify(formattedData, null, 2));

console.log('\n📋 7. اختبار formatFinancialArray:');
console.log('-'.repeat(40));
const sampleArray = [
  { id: 1, amount: 1000, balance: 500.25 },
  { id: 2, amount: null, balance: 'invalid' },
  { id: 3, amount: 0, balance: -250.75 }
];

const formattedArray = formatFinancialArray(sampleArray);
console.log('المصفوفة الأصلية:', JSON.stringify(sampleArray, null, 2));
console.log('المصفوفة المنسقة:', JSON.stringify(formattedArray, null, 2));

console.log('\n🎯 8. اختبار الحالات الحرجة:');
console.log('-'.repeat(40));

// Test cases that previously caused "ليس رقمًا LYD" issue
const criticalCases = [
  { value: null, description: 'قيمة فارغة' },
  { value: undefined, description: 'قيمة غير معرفة' },
  { value: '', description: 'نص فارغ' },
  { value: NaN, description: 'ليس رقمًا' },
  { value: 'abc', description: 'نص غير صالح' },
  { value: Infinity, description: 'لا نهاية' },
  { value: -Infinity, description: 'لا نهاية سالبة' }
];

criticalCases.forEach(testCase => {
  const formatted = formatCurrency(testCase.value, 'LYD');
  const shouldNotContainNaN = !formatted.includes('NaN') && !formatted.includes('ليس رقمًا');
  console.log(`${testCase.description.padEnd(20)} → ${formatted} ${shouldNotContainNaN ? '✅' : '❌'}`);
});

console.log('\n🌍 9. اختبار Locales مختلفة:');
console.log('-'.repeat(40));
const testValue = 1234567.89;
const locales = ['ar-LY', 'ar-EG', 'en-US'];

locales.forEach(locale => {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(testValue);
    console.log(`${locale.padEnd(10)} → ${formatted} ✅`);
  } catch (error) {
    console.log(`${locale.padEnd(10)} → خطأ: ${error.message} ❌`);
  }
});

console.log('\n✅ 10. ملخص النتائج:');
console.log('-'.repeat(40));

let passedTests = 0;
let totalTests = 0;

// Test all critical cases
criticalCases.forEach(testCase => {
  totalTests++;
  const formatted = formatCurrency(testCase.value, 'LYD');
  const passed = !formatted.includes('NaN') && 
                 !formatted.includes('ليس رقمًا') && 
                 !formatted.includes('Infinity') &&
                 formatted.includes('د.ل');
  if (passed) passedTests++;
});

// Test valid numbers
[1234.56, 0, -500.25, 1000000].forEach(value => {
  totalTests++;
  const formatted = formatCurrency(value, 'LYD');
  const passed = formatted.includes('د.ل') && !formatted.includes('NaN');
  if (passed) passedTests++;
});

console.log(`إجمالي الاختبارات: ${totalTests}`);
console.log(`الاختبارات الناجحة: ${passedTests}`);
console.log(`معدل النجاح: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
} else {
  console.log('\n⚠️ بعض الاختبارات فشلت. يرجى مراجعة النتائج أعلاه.');
}

console.log('\n' + '='.repeat(60));
console.log('✅ انتهى اختبار نظام تنسيق الأرقام والعملات');
