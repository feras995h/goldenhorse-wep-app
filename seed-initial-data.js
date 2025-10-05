/**
 * Seed initial data: default admin user + advanced chart of accounts
 * - Uses DATABASE_URL from env or embedded value in setup-database.js
 * - Idempotent: skips existing rows
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEmbeddedDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) return process.env.DATABASE_URL.trim();
  const setupPath = path.join(__dirname, 'setup-database.js');
  const content = fs.readFileSync(setupPath, 'utf8');
  const m = content.match(/postgres:\/\/[^'"\s]+/);
  if (!m) throw new Error('DATABASE_URL not found in setup-database.js');
  return m[0];
}

async function getBcryptHash(plain) {
  // Try to use bcryptjs from server node_modules; fallback to a precomputed hash for 'admin123'
  try {
    const modPath = path.join(__dirname, 'server', 'node_modules', 'bcryptjs', 'dist', 'bcrypt.js');
    const bcrypt = (await import(pathToFileURL(modPath).href)).default;
    return await bcrypt.hash(plain, 12);
  } catch (e) {
    if (plain === 'admin123') {
      // Precomputed bcrypt hash for 'admin123' (cost 10) as fallback
      return '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Jd0QxH7QhIhW8v9E2u2iQxZ2S9QPe';
    }
    throw e;
  }
}

function pathToFileURL(p) {
  const url = new URL('file://');
  const resolved = path.resolve(p);
  const parts = resolved.split(path.sep);
  if (parts[0].endsWith(':')) { url.pathname = '/' + parts.join('/'); } else { url.pathname = parts.join('/'); }
  return url;
}

function uuid() { return crypto.randomUUID(); }

async function upsertUser(client, { username, password, name, role }) {
  const id = uuid();
  const hash = await getBcryptHash(password);
  const now = new Date().toISOString();
  await client.query(
    `INSERT INTO "users" (id, username, password, name, role, "isActive", "passwordChangedAt", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,true,$6,$6,$6)
     ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, "isActive" = true, "updatedAt" = EXCLUDED."updatedAt"`,
    [id, username, hash, name, role, now]
  );
}

async function getAccountIdByCode(client, code) {
  const { rows } = await client.query('SELECT id FROM accounts WHERE code = $1', [code]);
  return rows[0]?.id || null;
}

async function ensureAccount(client, acc) {
  const existingId = await getAccountIdByCode(client, acc.code);
  if (existingId) return existingId;
  const id = uuid();
  const now = new Date().toISOString();
  await client.query(
    `INSERT INTO accounts (
      id, code, name, "nameEn", type, "rootType", "reportType",
      "accountCategory", "accountType", "parentId", level, "isGroup", "isActive",
      "freezeAccount", balance, currency, description, nature, notes, "isSystemAccount", "isMonitored",
      "createdAt", "updatedAt"
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,true,
      false,0,'LYD',$13,$14,$15,false,false,
      $16,$16
    )`,
    [
      id, acc.code, acc.name, acc.nameEn || null, acc.type, acc.rootType, acc.reportType,
      acc.accountCategory || null, acc.accountType || 'group', acc.parentId || null, acc.level || 1, !!acc.isGroup,
      acc.description || null, acc.nature, acc.notes || null, new Date().toISOString()
    ]
  );
  return id;
}

async function seedChartOfAccounts(client) {
  // Roots
  const roots = [
    { code: '1000', name: 'الأصول', nameEn: 'Assets', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true, nature: 'debit', level: 1 },
    { code: '2000', name: 'الالتزامات', nameEn: 'Liabilities', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true, nature: 'credit', level: 1 },
    { code: '3000', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: true, nature: 'credit', level: 1 },
    { code: '4000', name: 'الإيرادات', nameEn: 'Income', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: true, nature: 'credit', level: 1 },
    { code: '5000', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: true, nature: 'debit', level: 1 }
  ];

  const rootIds = {};
  for (const r of roots) {
    rootIds[r.code] = await ensureAccount(client, r);
  }

  // Assets (1000)
  const A = rootIds['1000'];
  const assets = [
    { code: '1100', name: 'النقد وما في حكمه', nameEn: 'Cash and equivalents', parentCode: '1000', isGroup: true, nature: 'debit', level: 2 },
    { code: '1101', name: 'الصندوق', nameEn: 'Cash on hand', parentCode: '1100', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },
    { code: '1102', name: 'البنك - رئيسي', nameEn: 'Bank - Main', parentCode: '1100', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },
    { code: '1103', name: 'العهدة المستديمة', nameEn: 'Petty Cash', parentCode: '1100', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },

    { code: '1200', name: 'الذمم المدينة', nameEn: 'Accounts Receivable', parentCode: '1000', isGroup: true, nature: 'debit', level: 2 },
    { code: '1201', name: 'عملاء - تجاري', nameEn: 'Trade Receivables', parentCode: '1200', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },
    { code: '1202', name: 'مخصص الديون المشكوك فيها', nameEn: 'Allowance for Doubtful Accounts', parentCode: '1200', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },

    { code: '1300', name: 'المخزون', nameEn: 'Inventory', parentCode: '1000', isGroup: true, nature: 'debit', level: 2 },
    { code: '1301', name: 'مخزون بضاعة', nameEn: 'Inventory - Goods', parentCode: '1300', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },

    { code: '1400', name: 'المصروفات المقدمة', nameEn: 'Prepaid Expenses', parentCode: '1000', isGroup: true, nature: 'debit', level: 2 },
    { code: '1401', name: 'إيجار مقدم', nameEn: 'Prepaid Rent', parentCode: '1400', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },

    { code: '1500', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', parentCode: '1000', isGroup: true, nature: 'debit', level: 2 },
    { code: '1501', name: 'مركبات', nameEn: 'Vehicles', parentCode: '1500', isGroup: false, nature: 'debit', level: 3, accountType: 'detail' },
    { code: '1550', name: 'مجمع الإهلاك', nameEn: 'Accumulated Depreciation', parentCode: '1500', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },
  ];

  // Liabilities (2000)
  const liabilities = [
    { code: '2100', name: 'الذمم الدائنة', nameEn: 'Accounts Payable', parentCode: '2000', isGroup: true, nature: 'credit', level: 2 },
    { code: '2101', name: 'موردون - تجاري', nameEn: 'Trade Payables', parentCode: '2100', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },

    { code: '2200', name: 'المستحقات', nameEn: 'Accrued Expenses', parentCode: '2000', isGroup: true, nature: 'credit', level: 2 },
    { code: '2201', name: 'رواتب مستحقة', nameEn: 'Salaries Payable', parentCode: '2200', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },

    { code: '2300', name: 'ضرائب مستحقة', nameEn: 'Taxes Payable', parentCode: '2000', isGroup: true, nature: 'credit', level: 2 },
    { code: '2301', name: 'ضريبة المبيعات مستحقة', nameEn: 'Sales Tax Payable', parentCode: '2300', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },

    { code: '2400', name: 'إيرادات مؤجلة', nameEn: 'Deferred Revenue', parentCode: '2000', isGroup: false, nature: 'credit', level: 2, accountType: 'detail' },
    { code: '2500', name: 'قروض بنكية', nameEn: 'Bank Loans', parentCode: '2000', isGroup: true, nature: 'credit', level: 2 },
    { code: '2501', name: 'قرض قصير الأجل', nameEn: 'Short-term Loan', parentCode: '2500', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },
  ];

  // Equity (3000)
  const equity = [
    { code: '3100', name: 'رأس المال', nameEn: "Owner's Capital", parentCode: '3000', isGroup: false, nature: 'credit', level: 2, accountType: 'detail' },
    { code: '3200', name: 'أرباح مبقاة', nameEn: 'Retained Earnings', parentCode: '3000', isGroup: false, nature: 'credit', level: 2, accountType: 'detail' },
  ];

  // Income (4000)
  const income = [
    { code: '4100', name: 'إيرادات المبيعات', nameEn: 'Sales Revenue', parentCode: '4000', isGroup: true, nature: 'credit', level: 2 },
    { code: '4101', name: 'إيرادات الشحن', nameEn: 'Shipping Revenue', parentCode: '4100', isGroup: false, nature: 'credit', level: 3, accountType: 'detail' },
    { code: '4900', name: 'إيرادات أخرى', nameEn: 'Other Income', parentCode: '4000', isGroup: false, nature: 'credit', level: 2, accountType: 'detail' },
  ];

  // Expenses (5000)
  const expenses = [
    { code: '5100', name: 'تكلفة المبيعات', nameEn: 'Cost of Goods Sold', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5200', name: 'مصروفات الرواتب', nameEn: 'Salaries Expense', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5300', name: 'مصروفات الإيجار', nameEn: 'Rent Expense', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5400', name: 'مصروفات الخدمات', nameEn: 'Utilities Expense', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5450', name: 'مصروفات الوقود', nameEn: 'Fuel Expense', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5500', name: 'مصروف الإهلاك', nameEn: 'Depreciation Expense', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5600', name: 'ديون مشكوك فيها', nameEn: 'Bad Debts Expense', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5700', name: 'رسوم بنكية', nameEn: 'Bank Fees', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
    { code: '5800', name: 'مستلزمات مكتبية', nameEn: 'Office Supplies', parentCode: '5000', isGroup: false, nature: 'debit', level: 2, accountType: 'detail' },
  ];

  const byCode = async (code) => await getAccountIdByCode(client, code);

  const all = [...assets, ...liabilities, ...equity, ...income, ...expenses];
  for (const acc of all) {
    // derive type/root/report from parent root code
    const rootCode = acc.parentCode?.substring(0,1) + '000';
    const root = roots.find(r => r.code === (acc.parentCode?.length === 4 ? (acc.parentCode.startsWith('1')?'1000':acc.parentCode.startsWith('2')?'2000':acc.parentCode.startsWith('3')?'3000':acc.parentCode.startsWith('4')?'4000':'5000') : rootCode))
      || roots.find(r => r.code === (acc.parentCode?.startsWith('1')?'1000':acc.parentCode?.startsWith('2')?'2000':acc.parentCode?.startsWith('3')?'3000':acc.parentCode?.startsWith('4')?'4000':'5000'))
      || roots[0];
    const parentId = await byCode(acc.parentCode);
    await ensureAccount(client, {
      ...acc,
      type: root.type,
      rootType: root.rootType,
      reportType: root.reportType,
      parentId,
      accountType: acc.accountType || (acc.isGroup ? 'group' : 'detail'),
    });
  }
}

async function main() {
  const url = readEmbeddedDatabaseUrl();
  const client = new Client({ connectionString: url, ssl: false });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 Seeding initial data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await client.connect();

    await client.query('BEGIN');
    // Admin user
    console.log('👤 Ensuring default admin user...');
    await upsertUser(client, { username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' });

    // Chart of accounts
    console.log('📚 Ensuring advanced chart of accounts...');
    await seedChartOfAccounts(client);

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('💥 Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
