import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import models, { sequelize } from '../models/index.js';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { Account, JournalEntry, JournalEntryDetail, Invoice, InvoicePayment, InvoiceReceipt } = models;

function toNum(v) { return parseFloat(v || 0); }

async function runAuditPreview({ dateFrom = null, dateTo = null } = {}) {
  const startedAt = new Date();
  const filters = { dateFrom, dateTo };

  // 1) Accounting equation based on stored balances (no recalculation)
  const accounts = await Account.findAll({ attributes: ['id', 'code', 'name', 'type', 'balance', 'isActive'], where: { isActive: true } });
  const totals = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
  for (const acc of accounts) {
    const t = acc.type; const bal = toNum(acc.balance);
    if (Object.prototype.hasOwnProperty.call(totals, t)) totals[t] += bal;
  }
  const assets = totals.asset;
  const liabilities = totals.liability;
  const equity = totals.equity;
  const equationDiff = assets - (liabilities + equity);
  const accountingEquationBalanced = Math.abs(equationDiff) < 0.01;

  // 2) Journal entries consistency (header vs details)
  const jeWhere = { status: { [Op.ne]: 'cancelled' } };
  if (dateFrom || dateTo) {
    jeWhere.date = {};
    if (dateFrom) jeWhere.date[Op.gte] = dateFrom;
    if (dateTo) jeWhere.date[Op.lte] = dateTo;
  }
  const journalEntries = await JournalEntry.findAll({
    where: jeWhere,
    attributes: ['id', 'entryNumber', 'date', 'status', 'totalDebit', 'totalCredit'],
    include: [{ model: JournalEntryDetail, as: 'details', attributes: ['debit', 'credit'] }]
  });

  const journalIssues = [];
  for (const je of journalEntries) {
    const headerDebit = toNum(je.totalDebit);
    const headerCredit = toNum(je.totalCredit);
    let sumDebit = 0, sumCredit = 0;
    for (const d of (je.details || [])) {
      sumDebit += toNum(d.debit);
      sumCredit += toNum(d.credit);
    }
    const headerMismatch = Math.abs(headerDebit - headerCredit) > 0.01;
    const detailMismatch = Math.abs(sumDebit - sumCredit) > 0.01;
    const headerDetailMismatch = Math.abs(headerDebit - sumDebit) > 0.01 || Math.abs(headerCredit - sumCredit) > 0.01;
    if (headerMismatch || detailMismatch || headerDetailMismatch) {
      journalIssues.push({
        id: je.id,
        entryNumber: je.entryNumber,
        date: je.date,
        header: { debit: headerDebit, credit: headerCredit },
        details: { debit: +sumDebit.toFixed(2), credit: +sumCredit.toFixed(2) },
        headerMismatch,
        detailMismatch,
        headerDetailMismatch
      });
    }
  }

  // 3) Invoices: recompute derived fields (no DB updates)
  const invWhere = { status: { [Op.ne]: 'cancelled' } };
  if (dateFrom || dateTo) {
    invWhere.date = {};
    if (dateFrom) invWhere.date[Op.gte] = dateFrom;
    if (dateTo) invWhere.date[Op.lte] = dateTo;
  }
  const invoices = await Invoice.findAll({ attributes: ['id', 'invoiceNumber', 'total', 'paidAmount', 'outstandingAmount', 'status', 'date'] , where: invWhere });
  let invoicesChecked = 0;
  const invoiceIssues = [];
  for (const inv of invoices) {
    invoicesChecked++;
    const total = toNum(inv.total);
    const fromReceipts = (await InvoiceReceipt.sum('allocatedAmount', { where: { invoiceId: inv.id, isReversed: false } })) || 0;
    const fromPayments = (await InvoicePayment.sum('allocatedAmount', { where: { invoiceId: inv.id, isReversed: false } })) || 0;
    const recomputedPaid = +(fromReceipts + fromPayments).toFixed(2);
    const recomputedOutstanding = Math.max(0, +(total - recomputedPaid).toFixed(2));
    const recomputedStatus = recomputedOutstanding <= 0.01 ? 'paid' : (recomputedPaid > 0 ? 'partially_paid' : 'unpaid');
    const diffPaid = Math.abs(recomputedPaid - toNum(inv.paidAmount));
    const diffOut = Math.abs(recomputedOutstanding - toNum(inv.outstandingAmount));
    const statusDiff = inv.status !== recomputedStatus;
    if (diffPaid > 0.01 || diffOut > 0.01 || statusDiff) {
      invoiceIssues.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        current: { paidAmount: toNum(inv.paidAmount), outstandingAmount: toNum(inv.outstandingAmount), status: inv.status },
        recomputed: { paidAmount: recomputedPaid, outstandingAmount: recomputedOutstanding, status: recomputedStatus }
      });
    }
  }

  // 4) Required accounts presence
  const requiredCodes = ['5.1.1','5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.1.9','1.1.2.1','3.1.3'];
  const existingRequired = await Account.findAll({ where: { code: { [Op.in]: requiredCodes } }, attributes: ['code'] });
  const existingCodes = new Set(existingRequired.map(a => a.code));
  const missingCodes = requiredCodes.filter(c => !existingCodes.has(c));

  const endedAt = new Date();
  const result = {
    success: true,
    mode: 'preview',
    summary: {
      accountingEquationBalanced,
      equationDiff: +equationDiff.toFixed(2),
      totals,
      journalEntriesChecked: journalEntries.length,
      journalIssues: journalIssues.length,
      invoicesChecked,
      invoiceIssues: invoiceIssues.length,
      missingRequiredAccounts: missingCodes.length
    },
    details: {
      journalIssues,
      invoiceIssues,
      missingRequiredAccountCodes: missingCodes
    },
    filters,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString()
  };

  return result;
}

(async () => {
  try {
    const args = process.argv.slice(2);
    const params = {};
    for (const arg of args) {
      const [k, v] = arg.split('=');
      if (k === 'dateFrom') params.dateFrom = v;
      if (k === 'dateTo') params.dateTo = v;
    }

    const report = await runAuditPreview(params);
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Audit preview failed:', err);
    process.exit(1);
  }
})();

