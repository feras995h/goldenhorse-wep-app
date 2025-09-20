import models from '../models/index.js';
import { Op, Sequelize } from 'sequelize';

function toNum(v) { return parseFloat(v || 0); }

function makeFailure({ id, severity = 'data', sql = null, description, remediation }) {
  return { id, severity, sql, description, remediation };
}

async function getBaseCurrency() {
  const { Setting } = models;
  try {
    const val = await Setting.get?.('base_currency', 'LYD');
    return val || 'LYD';
  } catch {
    return 'LYD';
  }
}

export default class AccountingAuditService {
  static async run(params = {}) {
    const start = Date.now();
    const failures = [];

    const {
      dateFrom = null,
      dateTo = null,
      agingDays = 30
    } = params;

    const { Account, JournalEntry, JournalEntryDetail, GLEntry, Invoice, Payment, Customer, FixedAsset } = models;

    const whereDateRange = (field) => {
      const w = {};
      if (dateFrom) w[Op.gte] = dateFrom;
      if (dateTo) w[Op.lte] = dateTo;
      return Object.keys(w).length ? { [field]: w } : {};
    };

    // 1) Posted journal entries are balanced (header vs details)
    const jeWhere = { status: 'posted', ...whereDateRange('date') };
    const postedEntries = await JournalEntry.findAll({
      where: jeWhere,
      attributes: ['id', 'entryNumber', 'date', 'totalDebit', 'totalCredit'],
      include: [{ model: JournalEntryDetail, as: 'details', attributes: ['debit', 'credit'] }]
    });

    let unbalancedCount = 0;
    for (const je of postedEntries) {
      const td = toNum(je.totalDebit), tc = toNum(je.totalCredit);
      let sd = 0, sc = 0;
      for (const d of (je.details || [])) { sd += toNum(d.debit); sc += toNum(d.credit); }
      const headerMismatch = Math.abs(td - tc) > 0.01;
      const detailMismatch = Math.abs(sd - sc) > 0.01;
      const headerDetailMismatch = Math.abs(td - sd) > 0.01 || Math.abs(tc - sc) > 0.01;
      if (headerMismatch || detailMismatch || headerDetailMismatch) {
        unbalancedCount++;
        failures.push(makeFailure({
          id: `JE_UNBAL_${je.entryNumber}`,
          severity: 'data',
          sql: 'SELECT id, entryNumber FROM journal_entries WHERE status = "posted";',
          description: `Journal entry ${je.entryNumber} is not balanced or header does not match details` ,
          remediation: 'Review lines and rounding; post an adjusting entry or fix source posting logic.'
        }));
      }
    }

    // 2) GL trial balance overall (non-cancelled GL entries)
    const glWhere = { isCancelled: false, ...whereDateRange('postingDate') };
    const totals = await GLEntry.findAll({
      where: glWhere,
      attributes: [
        [Sequelize.fn('ROUND', Sequelize.fn('SUM', Sequelize.col('debit')), 2), 'sumDebit'],
        [Sequelize.fn('ROUND', Sequelize.fn('SUM', Sequelize.col('credit')), 2), 'sumCredit']
      ],
      raw: true
    });
    const glSumDebit = toNum(totals?.[0]?.sumDebit);
    const glSumCredit = toNum(totals?.[0]?.sumCredit);
    const glDiff = +(glSumDebit - glSumCredit).toFixed(2);
    if (Math.abs(glDiff) > 0.01) {
      failures.push(makeFailure({
        id: 'TRIAL_BALANCE_OUT_OF_BALANCE',
        severity: 'data',
        sql: 'SELECT SUM(debit) AS d, SUM(credit) AS c FROM gl_entries WHERE isCancelled = 0;',
        description: `Trial balance not balanced. Debit=${glSumDebit}, Credit=${glSumCredit}, Diff=${glDiff}`,
        remediation: 'Locate offending vouchers and correct with adjusting entries; check duplicate/missing lines.'
      }));
    }

    // 3) Invoices posted/active must have GL entries
    const invWhere = { status: { [Op.notIn]: ['cancelled'] }, ...whereDateRange('date') };
    const invoices = await Invoice.findAll({ attributes: ['id','invoiceNumber','total','currency','exchangeRate','date','status'], where: invWhere });
    let missingInvoiceGL = 0;
    for (const inv of invoices) {
      const gl = await GLEntry.count({ where: { voucherType: 'Sales Invoice', voucherNo: inv.invoiceNumber, isCancelled: false } });
      if (gl === 0) {
        missingInvoiceGL++;
        failures.push(makeFailure({
          id: `INV_NO_GL_${inv.invoiceNumber}`,
          severity: 'logic',
          sql: 'SELECT i.invoiceNumber FROM invoices i LEFT JOIN gl_entries g ON g.voucherType=\'Sales Invoice\' AND g.voucherNo=i.invoiceNumber WHERE g.id IS NULL;',
          description: `Invoice ${inv.invoiceNumber} (${inv.status}) has no GL entries`,
          remediation: 'Generate JE via Invoice.createJournalEntry or mark invoice draft if not posted.'
        }));
      }
    }

    // 4) Completed payments must have GL entries
    const pays = await Payment.findAll({ attributes: ['id','paymentNumber','status','date'], where: { status: 'completed', ...whereDateRange('date') } });
    let missingPaymentGL = 0;
    for (const p of pays) {
      const gl = await GLEntry.count({ where: { voucherType: 'Payment Entry', voucherNo: p.paymentNumber, isCancelled: false } });
      if (gl === 0) {
        missingPaymentGL++;
        failures.push(makeFailure({
          id: `PAY_NO_GL_${p.paymentNumber}`,
          severity: 'logic',
          sql: 'SELECT p.paymentNumber FROM payments p LEFT JOIN gl_entries g ON g.voucherType=\'Payment Entry\' AND g.voucherNo=p.paymentNumber WHERE p.status=\'completed\' AND g.id IS NULL;',
          description: `Payment ${p.paymentNumber} (completed) has no GL entries`,
          remediation: 'Call payment.createJournalEntry to post GL or revert payment to pending.'
        }));
      }
    }

    // 5) Customers must have a linked account
    const customers = await Customer.findAll({ attributes: ['id','name','accountId','creditLimit','balance'] });
    let customersMissingAccount = 0;
    for (const c of customers) {
      if (!c.accountId) {
        customersMissingAccount++;
        failures.push(makeFailure({
          id: `CUST_NO_ACCOUNT_${c.id}`,
          severity: 'code',
          sql: 'SELECT id,name FROM customers WHERE accountId IS NULL;',
          description: `Customer ${c.name} has no linked accountId`,
          remediation: 'Ensure afterCreate hook creates a receivable sub-account and updates customer.accountId.'
        }));
      }
    }

    // 6) Inactive accounts with non-zero balance
    const inactiveWithBalance = await Account.findAll({ where: { isActive: false, balance: { [Op.ne]: 0 } }, attributes: ['code','name','balance'] });
    for (const a of inactiveWithBalance) {
      failures.push(makeFailure({
        id: `INACTIVE_NONZERO_${a.code}`,
        severity: 'data',
        sql: 'SELECT code,name,balance FROM accounts WHERE isActive=0 AND balance<>0;',
        description: `Inactive account ${a.code} - ${a.name} has non-zero balance ${a.balance}`,
        remediation: 'Post a transfer/closing entry to zero the balance before deactivating.'
      }));
    }

    // 7) Fixed assets: required accounts present and depreciation not exceeding cost
    const assets = await FixedAsset.findAll({ attributes: ['id','assetNumber','name','purchaseCost','assetAccountId','depreciationExpenseAccountId','accumulatedDepreciationAccountId'] });
    for (const fa of assets) {
      if (!fa.assetAccountId || !fa.depreciationExpenseAccountId || !fa.accumulatedDepreciationAccountId) {
        failures.push(makeFailure({
          id: `FA_MISSING_ACCOUNTS_${fa.assetNumber}`,
          severity: 'code',
          sql: 'SELECT assetNumber FROM fixed_assets WHERE assetAccountId IS NULL OR depreciationExpenseAccountId IS NULL OR accumulatedDepreciationAccountId IS NULL;',
          description: `Fixed asset ${fa.assetNumber} missing one or more linked accounts`,
          remediation: 'Run helper to create asset-specific, expense, and accumulated depreciation accounts.'
        }));
      }
      if (fa.accumulatedDepreciationAccountId) {
        const sums = await GLEntry.findAll({
          where: { accountId: fa.accumulatedDepreciationAccountId, isCancelled: false },
          attributes: [ [Sequelize.fn('SUM', Sequelize.col('credit')), 'sumCredit'], [Sequelize.fn('SUM', Sequelize.col('debit')), 'sumDebit'] ],
          raw: true
        });
        const accCredit = toNum(sums?.[0]?.sumCredit) - toNum(sums?.[0]?.sumDebit);
        if (accCredit - toNum(fa.purchaseCost) > 0.01) {
          failures.push(makeFailure({
            id: `FA_OVER_DEPR_${fa.assetNumber}`,
            severity: 'data',
            sql: 'SELECT * FROM gl_entries WHERE accountId = <accum_depr_account_id>;',
            description: `Accumulated depreciation exceeds cost for ${fa.assetNumber}`,
            remediation: 'Suspend auto depreciation; correct prior periods and post an adjustment.'
          }));
        }
      }
    }

    // 8) Credit limit violations
    const overLimit = customers.filter(c => toNum(c.balance) > toNum(c.creditLimit));
    for (const c of overLimit) {
      failures.push(makeFailure({
        id: `CREDIT_LIMIT_${c.id}`,
        severity: 'data',
        sql: 'SELECT name, balance, creditLimit FROM customers WHERE balance > creditLimit;',
        description: `Customer ${c.name} exceeds credit limit: balance=${c.balance}, limit=${c.creditLimit}`,
        remediation: 'Enforce credit hold or obtain approval; collect payment or increase limit.'
      }));
    }

    // 9) Aging summary (over X days)
    const agingCutoff = new Date(Date.now() - agingDays * 86400000).toISOString().slice(0,10);
    const overdue = await Invoice.count({ where: { status: { [Op.in]: ['unpaid','partially_paid'] }, dueDate: { [Op.lt]: agingCutoff }, outstandingAmount: { [Op.gt]: 0.01 } } });

    // 10) Multi-currency checks
    const baseCurrency = await getBaseCurrency();
    const mcInvoice = await Invoice.findAll({ attributes: ['invoiceNumber','currency','exchangeRate'], where: { currency: { [Op.ne]: baseCurrency } } });
    for (const inv of mcInvoice) {
      if (!inv.exchangeRate || inv.exchangeRate <= 0) {
        failures.push(makeFailure({
          id: `INV_EXRATE_${inv.invoiceNumber}`,
          severity: 'data',
          sql: 'SELECT invoiceNumber,currency,exchangeRate FROM invoices WHERE currency <> base_currency AND (exchangeRate IS NULL OR exchangeRate<=0);',
          description: `Invoice ${inv.invoiceNumber} has invalid/missing exchange rate (${inv.currency})`,
          remediation: 'Store exchange rate at posting time and use for GL amounts in base currency.'
        }));
      }
    }
    const mcPayments = await Payment.findAll({ attributes: ['paymentNumber','currency','exchangeRate'], where: { currency: { [Op.ne]: baseCurrency } } });
    for (const p of mcPayments) {
      if (!p.exchangeRate || p.exchangeRate <= 0) {
        failures.push(makeFailure({
          id: `PAY_EXRATE_${p.paymentNumber}`,
          severity: 'data',
          sql: 'SELECT paymentNumber,currency,exchangeRate FROM payments WHERE currency <> base_currency AND (exchangeRate IS NULL OR exchangeRate<=0);',
          description: `Payment ${p.paymentNumber} has invalid/missing exchange rate (${p.currency})`,
          remediation: 'Capture exchange rate and create FX gain/loss entry if needed.'
        }));
      }
    }

    // 11) Audit trail presence (table/model not found)
    const hasAuditModel = Boolean(models.AuditLog || models.Audit || models.ChangeLog);
    if (!hasAuditModel) {
      failures.push(makeFailure({
        id: 'AUDIT_TRAIL_MISSING',
        severity: 'code',
        sql: 'N/A',
        description: 'Audit trail model/table not implemented (audit_logs).',
        remediation: 'Introduce audit_logs table and write on create/update/delete with user, timestamp, payload.'
      }));
    }

    // Summaries
    const totalTests = 11; // number of categories checked above
    const failed = failures.length;
    const passed = totalTests - Math.min(totalTests, failed > 0 ? 1 /* categories */ : 0); // treat as categories

    const report = {
      total_tests: totalTests,
      passed,
      failed: failed > 0 ? 1 : 0, // categories, not individual issues
      failures,
      summary: {
        counts: {
          postedJournalEntries: postedEntries.length,
          unbalancedJournalEntries: unbalancedCount,
          invoicesChecked: invoices.length,
          invoicesMissingGL: missingInvoiceGL,
          paymentsChecked: pays.length,
          paymentsMissingGL: missingPaymentGL,
          customersMissingAccount,
          inactiveAccountsWithBalance: inactiveWithBalance.length,
          fixedAssetsChecked: assets.length,
          creditLimitBreaches: overLimit.length,
          overdueInvoices: overdue,
          glTotals: { debit: glSumDebit, credit: glSumCredit, diff: glDiff },
          baseCurrency
        },
        window: { dateFrom, dateTo, agingDays }
      },
      generatedAt: new Date().toISOString()
    };

    return report;
  }
}

