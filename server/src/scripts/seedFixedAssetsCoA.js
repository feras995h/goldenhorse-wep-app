import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { Account } = models;

function mapAsset() {
  return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
}

async function ensureChain(codeToId, code, t) {
  const parts = code.split('.');
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join('.');
    if (!codeToId.get(prefix)) {
      const parentCode = i > 1 ? parts.slice(0, i - 1).join('.') : null;
      const parentId = parentCode ? codeToId.get(parentCode) || null : null;
      const isGroup = true;
      const acc = await Account.findOrCreate({
        where: { code: prefix },
        defaults: {
          code: prefix,
          name: prefix,
          ...mapAsset(),
          parentId,
          level: i,
          isGroup,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          accountType: i === 1 ? 'main' : 'sub',
          description: 'Auto-created (fixed assets chain)'
        },
        transaction: t
      });
      const createdId = acc?.[0]?.id || (await Account.findOne({ where: { code: prefix }, transaction: t }))?.id;
      codeToId.set(prefix, createdId);
    }
  }
}

async function ensureAccount(codeToId, code, name, options, t) {
  await ensureChain(codeToId, code, t);
  const parentCode = code.includes('.') ? code.split('.').slice(0, -1).join('.') : null;
  const parentId = parentCode ? codeToId.get(parentCode) || null : null;
  const [acc] = await Account.findOrCreate({
    where: { code },
    defaults: {
      code,
      name,
      ...mapAsset(),
      ...(options || {}),
      parentId,
      level: code.split('.').length,
      isActive: true,
      balance: 0,
      currency: 'LYD',
      accountType: code.includes('.') ? 'sub' : 'main',
      description: options?.description || 'Fixed Assets COA seed'
    },
    transaction: t
  });
  codeToId.set(code, acc.id);
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    const [rows] = await sequelize.query('SELECT id, code FROM accounts', { transaction: t });
    const codeToId = new Map(rows.map(r => [r.code, r.id]));

    // Ensure 1.3 parent
    await ensureAccount(codeToId, '1', 'الأصول', { isGroup: true }, t);
    await ensureAccount(codeToId, '1.3', 'الأصول الثابتة', { isGroup: true }, t);

    // Fixed assets categories (groups)
    await ensureAccount(codeToId, '1.3.1', 'معدات وآلات', { isGroup: true }, t);
    await ensureAccount(codeToId, '1.3.2', 'سيارات', { isGroup: true }, t);
    await ensureAccount(codeToId, '1.3.3', 'أثاث وتجهيزات', { isGroup: true }, t);
    await ensureAccount(codeToId, '1.3.4', 'أجهزة الحاسب', { isGroup: true }, t);

    // Accumulated depreciation parent under fixed assets (contra-asset nature credit)
    await ensureChain(codeToId, '1.3.5', t);
    const parentId135 = codeToId.get('1.3');
    const [accDepParent] = await Account.findOrCreate({
      where: { code: '1.3.5' },
      defaults: {
        code: '1.3.5',
        name: 'مجمع إهلاك الأصول الثابتة',
        type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet',
        parentId: parentId135 || null,
        level: 3,
        isGroup: true,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature: 'credit', // contra-asset
        accountType: 'sub',
        description: 'Accumulated depreciation parent under fixed assets'
      },
      transaction: t
    });
    codeToId.set('1.3.5', accDepParent.id);

    await t.commit();
    console.log('✅ Seeded fixed assets base accounts (1.3.* and 1.3.5)');
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Failed to seed fixed assets base accounts:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });