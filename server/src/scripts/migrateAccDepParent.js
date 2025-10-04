import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { Account } = models;

async function ensureAccDepParent135(t) {
  const [acc] = await sequelize.query('SELECT id FROM accounts WHERE code = :code', {
    replacements: { code: '1.3.5' }, type: sequelize.QueryTypes.SELECT, transaction: t
  });
  if (acc?.id) return acc.id;
  // Create 1.3.5 under 1.3
  const [p] = await sequelize.query('SELECT id FROM accounts WHERE code = :code', {
    replacements: { code: '1.3' }, type: sequelize.QueryTypes.SELECT, transaction: t
  });
  const res = await Account.create({
    code: '1.3.5',
    name: 'مجمع إهلاك الأصول الثابتة',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    parentId: p?.id || null,
    level: 3,
    isGroup: true,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'credit',
    accountType: 'sub',
    description: 'Parent for accumulated depreciation of fixed assets'
  }, { transaction: t });
  return res.id;
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    const parent135Id = await ensureAccDepParent135(t);

    // Fetch all child accounts under 1.2.5.* (non-group)
    const olds = await sequelize.query(
      "SELECT id, code, name, level FROM accounts WHERE code LIKE '1.2.5.%' AND \"isGroup\" = false ORDER BY code",
      { type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!olds.length) {
      console.log('No 1.2.5.* child accounts found. Nothing to migrate.');
      await t.commit();
      await sequelize.close();
      return;
    }

    // Determine next available suffix under 1.3.5
    const exists135 = await sequelize.query(
      "SELECT code FROM accounts WHERE code LIKE '1.3.5.%' ORDER BY code",
      { type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    const usedNums = new Set(exists135.map(r => (r.code.match(/^1\.3\.5\.(\d{3})$/)?.[1]) ).filter(Boolean));

    function nextCode() {
      let i = 1;
      while (true) {
        const s = String(i).padStart(3, '0');
        if (!usedNums.has(s)) { usedNums.add(s); return `1.3.5.${s}`; }
        i++;
      }
    }

    const mapping = []; // {oldId, newId}

    for (const a of olds) {
      // Try to preserve last segment number if free
      const seg = a.code.match(/^1\.2\.5\.(\d{3})$/)?.[1];
      let newCode = (seg && !usedNums.has(seg)) ? `1.3.5.${seg}` : nextCode();

      // Create new account under 1.3.5
      const newAcc = await Account.create({
        code: newCode,
        name: a.name.replace('مجمع إهلاك', 'مجمع إهلاك').trim(),
        type: 'asset',
        rootType: 'Asset',
        reportType: 'Balance Sheet',
        parentId: parent135Id,
        level: 4,
        isGroup: false,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'credit',
        accountType: 'sub',
        description: 'Migrated from 1.2.5.* to 1.3.5.*'
      }, { transaction: t });

      // Update GL references
      await sequelize.query(
        'UPDATE gl_entries SET "accountId" = :newId WHERE "accountId" = :oldId',
        { replacements: { newId: newAcc.id, oldId: a.id }, transaction: t }
      );

      // Update fixed assets link if any
      await sequelize.query(
        'UPDATE fixed_assets SET "accumulatedDepreciationAccountId" = :newId WHERE "accumulatedDepreciationAccountId" = :oldId',
        { replacements: { newId: newAcc.id, oldId: a.id }, transaction: t }
      );

      // Deactivate old account (then delete)
      await sequelize.query('UPDATE accounts SET "isActive" = false WHERE id = :id', { replacements: { id: a.id }, transaction: t });
      await sequelize.query('DELETE FROM accounts WHERE id = :id', { replacements: { id: a.id }, transaction: t });

      mapping.push({ oldCode: a.code, newCode, oldId: a.id, newId: newAcc.id });
    }

    await t.commit();
    console.log('✅ Migrated accumulated depreciation accounts (1.2.5.* -> 1.3.5.*)');
    mapping.forEach(m => console.log(`  ${m.oldCode} -> ${m.newCode}`));
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Migration failed:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });