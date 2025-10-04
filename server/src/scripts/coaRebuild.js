import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { Account } = models;

function parseArgs(argv) {
  const args = { commit: false, dryRun: true, strategy: 'deactivate' };
  for (const a of argv.slice(2)) {
    if (a === '--commit') { args.commit = true; args.dryRun = false; }
    else if (a === '--dry-run') { args.dryRun = true; args.commit = false; }
    else if (a.startsWith('--strategy=')) { args.strategy = a.split('=')[1]; }
  }
  return args;
}

// Dot-style COA definition covering main needs. Uses Arabic naming with "الالتزامات".
const defs = [
  // Main
  { code: '1', name: 'الأصول', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', isGroup: true },
  { code: '2', name: 'المصروفات', type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', isGroup: true },
  { code: '3', name: 'الالتزامات', type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', isGroup: true },
  { code: '4', name: 'حقوق الملكية', type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', isGroup: true },
  { code: '5', name: 'الإيرادات', type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', isGroup: true },
  // Assets sub-groups
  { code: '1.1', name: 'الأصول المتداولة', parent: '1', type: 'asset', isGroup: true },
  { code: '1.2', name: 'الذمم', parent: '1', type: 'asset', isGroup: true },
  { code: '1.3', name: 'الأصول الثابتة', parent: '1', type: 'asset', isGroup: true },
  // Assets ledgers
  { code: '1.1.1', name: 'الصندوق', parent: '1.1', type: 'asset' },
  { code: '1.1.2', name: 'المصرف', parent: '1.1', type: 'asset' },
  { code: '1.2.1', name: 'ذمم العملاء', parent: '1.2', type: 'asset' },
  { code: '1.3.1', name: 'معدات وآلات', parent: '1.3', type: 'asset' },
  { code: '1.3.5', name: 'مجمع إهلاك الأصول الثابتة', parent: '1.3', type: 'asset', isGroup: true },
  // Expenses sub-groups
  { code: '2.1', name: 'مصروفات تشغيلية', parent: '2', type: 'expense', isGroup: true },
  // Expenses ledgers
  { code: '2.1.5', name: 'مصروفات الإهلاك', parent: '2.1', type: 'expense', isGroup: true },
  // Liabilities
  { code: '3.1', name: 'الالتزامات المتداولة', parent: '3', type: 'liability', isGroup: true },
  { code: '3.1.1', name: 'ذمم الموردين', parent: '3.1', type: 'liability' },
  // Revenue
  { code: '5.1', name: 'إيرادات الخدمات', parent: '5', type: 'revenue', isGroup: true },
  { code: '5.1.1', name: 'إيرادات التخزين', parent: '5.1', type: 'revenue' },
  { code: '5.1.2', name: 'إيرادات المناولة', parent: '5.1', type: 'revenue' },
  { code: '5.1.3', name: 'إيرادات الشحن', parent: '5.1', type: 'revenue' }
];

async function getByCode(code) {
  return Account.findOne({ where: { code } });
}

function computeRootAndReport(type) {
  const rootType = type === 'asset' ? 'Asset'
    : type === 'liability' ? 'Liability'
    : type === 'equity' ? 'Equity'
    : type === 'expense' ? 'Expense'
    : 'Income';
  const reportType = (type === 'expense' || type === 'revenue') ? 'Profit and Loss' : 'Balance Sheet';
  const nature = (type === 'asset' || type === 'expense') ? 'debit' : 'credit';
  return { rootType, reportType, nature };
}

async function ensureAccount(data, codeToIdCache, t) {
  const existing = await getByCode(data.code);
  if (existing) return existing;
  const parentId = data.parent ? (codeToIdCache.get(data.parent) || (await getByCode(data.parent))?.id || null) : null;
  const { rootType, reportType, nature } = computeRootAndReport(data.type);
  const acc = await Account.create({
    code: data.code,
    name: data.name,
    type: data.type,
    rootType,
    reportType,
    parentId,
    level: (data.code.match(/\./g)?.length || 0) + 1,
    isGroup: !!data.isGroup,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature,
    accountType: (data.code.includes('.')) ? 'sub' : 'main',
    description: 'System rebuilt account'
  }, { transaction: t });
  return acc;
}

async function main() {
  const args = parseArgs(process.argv);
  await sequelize.authenticate();

  // Identify flat-coded accounts
  const [flat] = await sequelize.query("SELECT id, code, name FROM accounts WHERE code ~ '^[0-9]{4}$'");
  console.log(`📋 Flat-coded accounts detected: ${flat.length}`);

  if (args.strategy === 'delete' && !args.commit) {
    console.log('⚠️ Strategy delete requested, but running in dry-run. No changes applied.');
  }

  if (args.strategy === 'delete' && args.commit) {
    const t = await sequelize.transaction();
    try {
      // Mapping from flat main codes to dot-style parents
      const reparentMap = {
        '1000': '1',
        '1100': '1.1',
        '2000': '3',
        '3000': '4',
        '4000': '5',
        '5000': '2'
      };
      let deleted = 0;
      for (const r of flat) {
        // Reparent children if needed
        const targetCode = reparentMap[r.code];
        if (targetCode) {
          const [targetRow] = await sequelize.query('SELECT id FROM accounts WHERE code = :code', { replacements: { code: targetCode }, transaction: t, type: sequelize.QueryTypes.SELECT });
          if (targetRow?.id) {
            await sequelize.query('UPDATE accounts SET "parentId" = :newId WHERE "parentId" = :oldId', { replacements: { newId: targetRow.id, oldId: r.id }, transaction: t });
          }
        }
        // Ensure no GL refs exist
        const [refGl] = await sequelize.query('SELECT COUNT(*)::int AS cnt FROM gl_entries WHERE "accountId" = :id', { replacements: { id: r.id }, transaction: t, type: sequelize.QueryTypes.SELECT });
        const [refChild] = await sequelize.query('SELECT COUNT(*)::int AS cnt FROM accounts WHERE "parentId" = :id', { replacements: { id: r.id }, transaction: t, type: sequelize.QueryTypes.SELECT });
        const used = (refGl?.cnt || 0) > 0 || (refChild?.cnt || 0) > 0;
        if (used) {
          console.log(`⏭️ Skip delete in-use account ${r.code} - ${r.name}`);
          continue;
        }
        await sequelize.query('DELETE FROM accounts WHERE id = :id', { replacements: { id: r.id }, transaction: t });
        deleted += 1;
      }
      await t.commit();
      console.log(`✅ Deleted ${deleted} flat-coded accounts`);
      await sequelize.close();
      process.exit(0);
    } catch (e) {
      await t.rollback();
      console.error('❌ Delete failed:', e.message);
      await sequelize.close();
      process.exit(1);
    }
  }

  if (args.strategy === 'deactivate') {
    const t = await sequelize.transaction();
    try {
      if (!args.dryRun) {
        if (flat.length > 0) {
          const ids = flat.map(r => r.id);
await sequelize.query('UPDATE accounts SET "isActive" = false WHERE id IN (:ids)', { replacements: { ids }, transaction: t });
          console.log(`✅ Deactivated ${ids.length} flat-coded accounts`);
        }
      } else {
        console.log(`📝 Would deactivate ${flat.length} flat-coded accounts`);
      }

      const codeToId = new Map();
      for (const d of defs) {
        if (args.dryRun) {
          const exists = await getByCode(d.code);
          console.log(exists ? `• Exists ${d.code} - ${d.name}` : `+ Create ${d.code} - ${d.name}`);
          continue;
        }
        const acc = await ensureAccount(d, codeToId, t);
        codeToId.set(d.code, acc.id);
      }

      if (!args.dryRun) await t.commit(); else await t.rollback();
      console.log(`✅ COA rebuild completed (strategy=${args.strategy}, dryRun=${args.dryRun})`);
    } catch (e) {
      await t.rollback();
      console.error('❌ COA rebuild failed:', e.message);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  } else {
    console.log(`❌ Unknown strategy: ${args.strategy}`);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
