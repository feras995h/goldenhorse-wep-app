import 'dotenv/config';
import models, { sequelize } from '../models/index.js';
import advancedFixedAssetManager from '../utils/advancedFixedAssetManager.js';
import { ensureDefaultMainAccounts, ensureOperationalSubAccounts } from '../utils/ensureDefaultAccounts.js';

const { Customer, Account, FixedAsset } = models;

function parseArgs(argv) {
  const args = {
    commit: false,
    dryRun: true,
    limit: 0,
    customerOnly: false,
    assetsOnly: false
  };
  for (const a of argv.slice(2)) {
    if (a === '--commit') { args.commit = true; args.dryRun = false; }
    else if (a === '--dry-run') { args.dryRun = true; args.commit = false; }
    else if (a.startsWith('--limit=')) { args.limit = parseInt(a.split('=')[1]) || 0; }
    else if (a === '--customer-only') { args.customerOnly = true; }
    else if (a === '--assets-only') { args.assetsOnly = true; }
  }
  return args;
}

async function columnExists(table, column) {
  const qi = sequelize.getQueryInterface();
  try {
    const desc = await qi.describeTable(table);
    return !!desc[column];
  } catch (_e) {
    return false;
  }
}

async function findReceivablesParentAccount() {
  // Try common candidates in priority order
  const candidates = [
    { code: '1.2.1' }, // Accounts Receivable (dot-style)
    { code: '1201' },  // Accounts Receivable (flat-style)
  ];
  for (const cond of candidates) {
    const acc = await Account.findOne({ where: cond });
    if (acc) return acc;
  }
  // Fallback: name-based search
  const acc = await Account.findOne({
    where: {
      [models.sequelize.Op.and]: [
        { type: 'asset' },
        {
          [models.sequelize.Op.or]: [
            { name: { [models.sequelize.Op.like]: '%ذمم%' } },
            { name: { [models.sequelize.Op.like]: '%عملاء%' } },
            { nameEn: { [models.sequelize.Op.iLike]: '%receivable%' } }
          ]
        }
      ]
    },
    order: [['level','ASC']]
  });
  return acc || null;
}

async function ensureUniqueCode(initialCode) {
  // Ensure the code is unique; if not, add numeric suffixes up to 9
  let code = initialCode;
  for (let i = 0; i < 10; i++) {
    const exists = await Account.findOne({ where: { code } });
    if (!exists) return code;
    // If exists, try to append or replace last char with a digit
    if (code.length < 20) {
      code = `${initialCode}${i}`;
    } else {
      code = `${initialCode.slice(0, 19)}${i}`;
    }
  }
  return code;
}

function buildAccountCode(parentCode, customer) {
  const maxLen = 20;
  const sep = '-';
  const basePrefix = `${parentCode}${sep}`;
  const remain = maxLen - basePrefix.length;
  let suffix = String(customer.code || '').trim();
  if (!suffix) suffix = (customer.name || 'CUST').replace(/\s+/g, '').slice(0, remain);
  if (suffix.length > remain) {
    const idSuffix = (customer.id || '').replace(/-/g, '').slice(-4) || '0000';
    const coreLen = Math.max(3, remain - idSuffix.length);
    suffix = `${suffix.slice(0, coreLen)}${idSuffix}`;
  }
  return `${basePrefix}${suffix}`;
}

async function backfillCustomerAccounts({ dryRun, limit }) {
  const results = { processed: 0, createdAccounts: 0, linkedCustomers: 0, skipped: 0, errors: 0 };

  // Ensure default main and operational accounts exist to increase likelihood of finding AR
  try {
    await ensureDefaultMainAccounts(models);
    await ensureOperationalSubAccounts(models);
  } catch (_) {}

  const parent = await findReceivablesParentAccount();
  if (!parent) {
    console.log('❌ No Accounts Receivable parent account found. Aborting customer backfill.');
    return results;
  }

  const where = { accountId: null };
  const options = { where, order: [['name','ASC']] };
  if (limit && limit > 0) options.limit = limit;

  const customers = await Customer.findAll(options);
  console.log(`👥 Customers missing accountId: ${customers.length}`);

  for (const c of customers) {
    results.processed += 1;
    const rawCode = buildAccountCode(parent.code, c);
    const accountCode = await ensureUniqueCode(rawCode);

    // If an account already exists with this code, just link
    const existing = await Account.findOne({ where: { code: accountCode } });

    if (existing) {
      if (!dryRun) {
        await c.update({ accountId: existing.id });
      }
      results.linkedCustomers += 1;
      console.log(`  ✓ Linked existing account ${accountCode} to ${c.name}`);
      continue;
    }

    if (dryRun) {
      console.log(`  • Would create account ${accountCode} for ${c.name} and link to customer`);
      continue;
    }

    try {
      const acc = await Account.create({
        code: accountCode,
        name: `${c.name} - ذمم عملاء`,
        nameEn: `${c.nameEn || c.name} - Receivable`,
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: parent.id,
        level: (parent.level || 1) + 1,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: c.currency || 'LYD',
        nature: 'debit',
        accountType: 'sub',
        description: `Customer receivable for ${c.name} (${c.code})`
      });
      await c.update({ accountId: acc.id });
      results.createdAccounts += 1;
      results.linkedCustomers += 1;
      console.log(`  ✓ Created ${acc.code} and linked to ${c.name}`);
    } catch (e) {
      results.errors += 1;
      console.warn(`  ✗ Failed to create/link account for ${c.name}: ${e.message}`);
    }
  }

  return results;
}

async function backfillFixedAssetAccounts({ dryRun, limit }) {
  const results = { processed: 0, createdAssetAccounts: 0, createdAccDep: 0, createdDepExp: 0, linked: 0, skipped: 0, errors: 0 };

  const hasAssetId = await columnExists('fixed_assets', 'assetAccountId');
  const hasAccDepId = await columnExists('fixed_assets', 'accumulatedDepreciationAccountId');
  const hasDepExpId = await columnExists('fixed_assets', 'depreciationExpenseAccountId');

  const linkable = hasAssetId && hasAccDepId && hasDepExpId;
  if (!linkable) {
    console.log('ℹ️ Fixed asset linking columns missing on fixed_assets. Will create accounts but skip linking.');
  }

  const where = {}; // consider only active or all? We'll do all
  const options = { where, order: [['assetNumber','ASC']] };
  if (limit && limit > 0) options.limit = limit;

  const assets = await FixedAsset.findAll(options);
  console.log(`🏗️ Fixed assets to assess: ${assets.length}`);

  for (const fa of assets) {
    results.processed += 1;

    // Need a category account as base
    const categoryAccount = fa.categoryAccountId ? await Account.findByPk(fa.categoryAccountId) : null;
    if (!categoryAccount) {
      results.skipped += 1;
      console.log(`  • Skipping ${fa.assetNumber} (${fa.name}) — missing categoryAccountId`);
      continue;
    }

    // If already linked (when columns exist), skip
    if (linkable && (fa.assetAccountId || fa.accumulatedDepreciationAccountId || fa.depreciationExpenseAccountId)) {
      results.skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`  • Would create asset/accumulated/expense accounts for ${fa.assetNumber} (${fa.name}) under ${categoryAccount.code}`);
      continue;
    }

    const t = await sequelize.transaction();
    try {
      const created = await advancedFixedAssetManager.createFixedAssetAccounts(fa, categoryAccount, t);
      if (created.assetAccount) results.createdAssetAccounts += 1;
      if (created.accumulatedDepreciationAccount) results.createdAccDep += 1;
      if (created.depreciationExpenseAccount) results.createdDepExp += 1;

      if (linkable) {
        // Use raw SQL to avoid model attribute omissions
        await sequelize.query(
          'UPDATE fixed_assets SET "assetAccountId" = :assetId, "accumulatedDepreciationAccountId" = :accId, "depreciationExpenseAccountId" = :depId WHERE id = :faId',
          {
            replacements: {
              assetId: created.assetAccount?.id || null,
              accId: created.accumulatedDepreciationAccount?.id || null,
              depId: created.depreciationExpenseAccount?.id || null,
              faId: fa.id
            },
            transaction: t
          }
        );
        results.linked += 1;
      }

      await t.commit();
      console.log(`  ✓ Created related accounts for ${fa.assetNumber} (${fa.name})`);
    } catch (e) {
      await t.rollback();
      results.errors += 1;
      console.warn(`  ✗ Failed to create/link accounts for ${fa.assetNumber}: ${e.message}`);
    }
  }

  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log('🔧 Backfill Accounts — args:', args);

  // Verify DB connectivity
  try {
    await sequelize.authenticate();
    console.log('🗄️ Connected to database.');
  } catch (e) {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  }

  const summary = { customers: null, fixedAssets: null };

  if (!args.assetsOnly) {
    console.log('\n=== Backfill: Customers (missing accountId) ===');
    summary.customers = await backfillCustomerAccounts({ dryRun: args.dryRun, limit: args.limit });
  }

  if (!args.customerOnly) {
    console.log('\n=== Backfill: Fixed Assets (create related accounts) ===');
    summary.fixedAssets = await backfillFixedAssetAccounts({ dryRun: args.dryRun, limit: args.limit });
  }

  console.log('\n📊 Backfill Summary:');
  console.log(JSON.stringify(summary, null, 2));

  await sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled error in backfill:', err);
  process.exit(1);
});