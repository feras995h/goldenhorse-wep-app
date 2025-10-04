import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { Account } = models;

function mapTypeFromTop(code) {
  const top = String(code).split('.')[0];
  switch (top) {
    case '1': return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
    case '2': return { type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit' };
    case '3': return { type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', nature: 'credit' };
    case '4': return { type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', nature: 'credit' };
    case '5': return { type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit' };
    default: return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
  }
}

async function ensurePrefix(codeParts, codeToId, t) {
  for (let i = 1; i < codeParts.length; i++) {
    const prefix = codeParts.slice(0, i).join('.');
    if (!codeToId.has(prefix)) {
      const { type, rootType, reportType, nature } = mapTypeFromTop(prefix);
      const parentPrefix = i > 1 ? codeParts.slice(0, i - 1).join('.') : null;
      const [parentRow] = parentPrefix
        ? await sequelize.query('SELECT id FROM accounts WHERE code = :c', { replacements: { c: parentPrefix }, type: sequelize.QueryTypes.SELECT, transaction: t })
        : [null];
      const acc = await Account.create({
        code: prefix,
        name: prefix,
        type,
        rootType,
        reportType,
        parentId: parentRow?.id || null,
        level: i,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature,
        accountType: i === 1 ? 'main' : 'sub',
        description: 'Auto-created prefix'
      }, { transaction: t });
      codeToId.set(prefix, acc.id);
    }
  }
}

async function relocateSuspiciousFixedAssetUnder12(t) {
  // Keywords to detect fixed asset-related accounts under 1.2
  const kw = ['أصل', 'الأصول', 'إهلاك', 'مجمع', 'معدات', 'آلات', 'سيارة', 'أثاث'];
  const likeConds = kw.map((k, idx) => `name LIKE :k${idx}`).join(' OR ');
  const repl = Object.fromEntries(kw.map((k, i) => [`k${i}`, `%${k}%`]));
  const suspects = await sequelize.query(
    `SELECT id, code, name FROM accounts WHERE code LIKE '1.2.%' AND (${likeConds})`,
    { replacements: repl, type: sequelize.QueryTypes.SELECT, transaction: t }
  );
  if (suspects.length === 0) return 0;

  // Ensure 1.3.1 exists
  const [faParentRow] = await sequelize.query("SELECT id FROM accounts WHERE code = '1.3.1'", { type: sequelize.QueryTypes.SELECT, transaction: t });
  let faParentId = faParentRow?.id;
  if (!faParentId) {
    const [p] = await sequelize.query("SELECT id FROM accounts WHERE code = '1.3'", { type: sequelize.QueryTypes.SELECT, transaction: t });
    const faParent = await Account.create({
      code: '1.3.1',
      name: 'معدات وآلات',
      type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet',
      parentId: p?.id || null, level: 3, isGroup: true, isActive: true,
      balance: 0, currency: 'LYD', nature: 'debit', accountType: 'sub', description: 'Fixed assets category'
    }, { transaction: t });
    faParentId = faParent.id;
  }

  // Find next suffix under 1.3.1
  const exists = await sequelize.query("SELECT code FROM accounts WHERE code LIKE '1.3.1.%' ORDER BY code", { type: sequelize.QueryTypes.SELECT, transaction: t });
  const used = new Set(exists.map(r => r.code.match(/^1\.3\.1\.(\d{3})$/)?.[1]).filter(Boolean));
  function nextFa() { let i = 1; for (;;) { const s = String(i).padStart(3, '0'); if (!used.has(s)) { used.add(s); return `1.3.1.${s}`; } i++; } }

  let moved = 0;
  for (const s of suspects) {
    const newCode = nextFa();
    const newAcc = await Account.create({
      code: newCode, name: s.name, type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet',
      parentId: faParentId, level: 4, isGroup: false, isActive: true, balance: 0, currency: 'LYD', nature: 'debit', accountType: 'sub', description: 'Relocated from 1.2.*'
    }, { transaction: t });
    await sequelize.query('UPDATE gl_entries SET "accountId" = :newId WHERE "accountId" = :oldId', { replacements: { newId: newAcc.id, oldId: s.id }, transaction: t });
    await sequelize.query('UPDATE fixed_assets SET "assetAccountId" = :newId WHERE "assetAccountId" = :oldId', { replacements: { newId: newAcc.id, oldId: s.id }, transaction: t });
    await sequelize.query('DELETE FROM accounts WHERE id = :id', { replacements: { id: s.id }, transaction: t });
    moved++;
  }
  return moved;
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    const [rows] = await sequelize.query('SELECT id, code FROM accounts ORDER BY code', { transaction: t });
    const codeToId = new Map(rows.map(r => [r.code, r.id]));

    // Ensure intermediate parent prefixes exist for all accounts
    for (const r of rows) {
      const parts = String(r.code).split('.');
      if (parts.length > 1) {
        await ensurePrefix(parts, codeToId, t);
      }
    }

    // Relocate suspicious fixed asset accounts under 1.2 to 1.3.1
    const moved = await relocateSuspiciousFixedAssetUnder12(t);

    await t.commit();
    console.log(`✅ Fixed COA structure. Intermediates ensured. Relocated under 1.2 -> 1.3.1: ${moved}`);

    // Run normalization pass (levels/parents/isGroup) using existing script if desired
    // Could be invoked separately via npm run coa:normalize

    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ fixCoaStructure failed:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });