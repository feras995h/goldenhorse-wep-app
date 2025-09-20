import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import models, { sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ensureDefaultMainAccounts, ensureOperationalSubAccounts } from '../utils/ensureDefaultAccounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { Account, Invoice, InvoicePayment, InvoiceReceipt } = models;

function toNum(v) { return parseFloat(v || 0) || 0; }

function guessTypeFromCode(code) {
  // First segment before dot determines group: '1' asset, '3' liability, '5' revenue, '2' expense, '4' equity
  const root = (code || '').split('.')[0];
  switch (root) {
    case '1': return { type: 'asset', nature: 'debit', rootType: 'Asset', reportType: 'Balance Sheet' };
    case '2': return { type: 'expense', nature: 'debit', rootType: 'Expense', reportType: 'Profit and Loss' };
    case '3': return { type: 'liability', nature: 'credit', rootType: 'Liability', reportType: 'Balance Sheet' };
    case '4': return { type: 'equity', nature: 'credit', rootType: 'Equity', reportType: 'Balance Sheet' };
    case '5': return { type: 'revenue', nature: 'credit', rootType: 'Income', reportType: 'Profit and Loss' };
    default: return { type: 'asset', nature: 'debit', rootType: 'Asset', reportType: 'Balance Sheet' };
  }
}

async function ensureAccountByCode(code, nameAr, nameEn) {
  let acc = await Account.findOne({ where: { code } });
  if (acc) return { created: false, account: acc };

  // Try to find parent by stripping last segment
  const parts = code.split('.');
  const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : null;
  let parent = null;
  if (parentCode) parent = await Account.findOne({ where: { code: parentCode } });

  // Fallback parent: main root by first segment
  if (!parent && parts.length > 0) {
    parent = await Account.findOne({ where: { code: parts[0] } });
  }

  const level = parts.length;
  const classification = guessTypeFromCode(code);
  const data = {
    id: uuidv4(),
    code,
    name: nameAr,
    nameEn,
    level,
    isGroup: false,
    isActive: true,
    accountType: level === 1 ? 'main' : 'sub',
    currency: 'LYD',
    balance: 0,
    parentId: parent ? parent.id : null,
    ...classification,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  acc = await Account.create(data);
  return { created: true, account: acc };
}

async function fixInvoicesDerivedFields({ dateFrom = null, dateTo = null } = {}) {
  const invWhere = { status: { [Op.ne]: 'cancelled' } };
  if (dateFrom || dateTo) {
    invWhere.date = {};
    if (dateFrom) invWhere.date[Op.gte] = dateFrom;
    if (dateTo) invWhere.date[Op.lte] = dateTo;
  }

  const invoices = await Invoice.findAll({ attributes: ['id','invoiceNumber','total','paidAmount','outstandingAmount','status','date'], where: invWhere });
  let checked = 0, updated = 0;
  const changes = [];
  for (const inv of invoices) {
    checked++;
    const total = toNum(inv.total);
    const paidFromReceipts = (await InvoiceReceipt.sum('allocatedAmount', { where: { invoiceId: inv.id, isReversed: false } })) || 0;
    const paidFromPayments = (await InvoicePayment.sum('allocatedAmount', { where: { invoiceId: inv.id, isReversed: false } })) || 0;
    const recomputedPaid = +(paidFromReceipts + paidFromPayments).toFixed(2);
    const recomputedOutstanding = Math.max(0, +(total - recomputedPaid).toFixed(2));
    const recomputedStatus = recomputedOutstanding <= 0.01 ? 'paid' : (recomputedPaid > 0 ? 'partially_paid' : 'unpaid');

    const diffPaid = Math.abs(recomputedPaid - toNum(inv.paidAmount));
    const diffOut = Math.abs(recomputedOutstanding - toNum(inv.outstandingAmount));
    const statusDiff = inv.status !== recomputedStatus;

    if (diffPaid > 0.01 || diffOut > 0.01 || statusDiff) {
      await inv.update({ paidAmount: recomputedPaid, outstandingAmount: recomputedOutstanding, status: recomputedStatus });
      updated++;
      changes.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, from: { paidAmount: toNum(inv.paidAmount), outstandingAmount: toNum(inv.outstandingAmount), status: inv.status }, to: { paidAmount: recomputedPaid, outstandingAmount: recomputedOutstanding, status: recomputedStatus } });
    }
  }
  return { checked, updated, changes };
}

async function ensureRequiredAccounts() {
  // First ensure main accounts and operational subs
  const mainRes = await ensureDefaultMainAccounts(models);
  const opsRes = await ensureOperationalSubAccounts(models);

  // Then ensure specific required codes
  const required = [
    { code: '5.2.1', name: 'إيرادات أخرى 1', nameEn: 'Other Revenue 1' },
    { code: '5.2.2', name: 'إيرادات أخرى 2', nameEn: 'Other Revenue 2' },
    { code: '5.2.3', name: 'إيرادات أخرى 3', nameEn: 'Other Revenue 3' },
    { code: '5.2.4', name: 'إيرادات أخرى 4', nameEn: 'Other Revenue 4' },
    { code: '5.2.5', name: 'إيرادات أخرى 5', nameEn: 'Other Revenue 5' },
    { code: '5.1.9', name: 'إيرادات خدمات أخرى', nameEn: 'Other Services Revenue' },
    { code: '1.1.2.1', name: 'حساب مصرف فرعي 1', nameEn: 'Bank Sub Account 1' },
    { code: '3.1.3', name: 'التزامات أخرى', nameEn: 'Other Liabilities' }
  ];

  let created = 0; const createdList = [];
  for (const r of required) {
    const exists = await Account.findOne({ where: { code: r.code } });
    if (exists) continue;
    const { created: c, account } = await ensureAccountByCode(r.code, r.name, r.nameEn);
    if (c) { created++; createdList.push({ code: account.code, name: account.name }); }
  }

  return { mainCreated: mainRes?.created || 0, opsCreated: opsRes?.created || 0, specificCreated: created, createdList };
}

(async () => {
  try {
    console.log('🚀 Running invoice safe-fix and ensuring required accounts...');

    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const fixRes = await fixInvoicesDerivedFields();
    console.log(`🧾 Invoices checked: ${fixRes.checked}, updated: ${fixRes.updated}`);

    const accRes = await ensureRequiredAccounts();
    console.log(`📚 Accounts created - main: ${accRes.mainCreated}, operational: ${accRes.opsCreated}, specific: ${accRes.specificCreated}`);

    const report = {
      success: true,
      invoices: fixRes,
      accounts: accRes,
      finishedAt: new Date().toISOString()
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Operation failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
})();

