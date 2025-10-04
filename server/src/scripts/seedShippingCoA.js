import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { Account } = models;

function mapType(top) {
  switch (top) {
    case '1': return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
    case '2': return { type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit' };
    case '3': return { type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', nature: 'credit' };
    case '4': return { type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', nature: 'credit' };
    case '5': return { type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit' };
    default: return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
  }
}

// Shipping & International Sales tailored accounts
const accounts = [
  // Assets extensions
  { code: '1.1.2.1', name: 'حساب مصرفي - LYD' },
  { code: '1.1.2.2', name: 'حساب مصرفي - USD' },
  { code: '1.1.2.3', name: 'حساب مصرفي - EUR' },

  { code: '1.2.1', name: 'ذمم العملاء - محلي' },
  { code: '1.2.2', name: 'ذمم العملاء - أجانب' },
  { code: '1.2.9', name: 'ذمم أخرى' },

  // Fixed assets groups exist under 1.3; leave to operational creation for asset-specific

  // Liabilities
  { code: '3.1.5', name: 'دفعات مقدمة من العملاء' },
  { code: '3.1.6', name: 'موردون دوليون' },
  { code: '3.1.7', name: 'مصاريف مستحقة أجور نقل' },

  // Revenue (operational)
  { code: '5.1.4', name: 'إيرادات التخليص الجمركي' },
  { code: '5.1.5', name: 'إيرادات التأمين' },
  { code: '5.1.6', name: 'رسوم المستندات' },
  { code: '5.1.7', name: 'إيرادات أرضيات/احتجاز' },
  { code: '5.1.8', name: 'رسوم إذن التسليم' },
  { code: '5.1.9', name: 'إيرادات التخزين (مستودعات)' },
  { code: '5.1.10', name: 'إيرادات نقل بري داخلي' },
  // Non-operating gains
  { code: '5.2.1', name: 'أرباح فروق عملة' },

  // Expenses - Cost of Services
  { code: '2.4.1', name: 'تكلفة شحن بحري' },
  { code: '2.4.2', name: 'تكلفة شحن جوي' },
  { code: '2.4.3', name: 'تكلفة نقل بري داخلي' },
  { code: '2.4.4', name: 'تكلفة مناولة بالميناء' },
  { code: '2.4.5', name: 'تكلفة تخليص جمركي' },
  { code: '2.4.6', name: 'تكلفة تأمين' },
  { code: '2.4.7', name: 'تكلفة تخزين/مستودعات' },
  { code: '2.4.8', name: 'غرامات أرضيات/احتجاز' },
  { code: '2.4.9', name: 'تكلفة مستندات' },

  // Admin & others
  { code: '2.3.4', name: 'تدريب' },
  { code: '2.3.5', name: 'صيانة' },
  { code: '2.3.6', name: 'تسويق' },
  { code: '2.3.7', name: 'سفر وإقامة' },
  { code: '2.3.8', name: 'أتعاب مهنية' },
  { code: '2.5.3', name: 'رسوم بنكية' },
  { code: '2.5.4', name: 'غرامات وعقوبات' },
  { code: '2.5.5', name: 'خسائر فروق عملة' },
];

function byDepth(a, b) {
  const da = a.code.split('.').length;
  const db = b.code.split('.').length;
  if (da !== db) return da - db;
  return a.code.localeCompare(b.code);
}

async function ensureChain(codeToId, code, t) {
  const parts = code.split('.');
  let chain = '';
  for (let i = 0; i < parts.length - 1; i++) {
    chain = i === 0 ? parts[0] : `${chain}.${parts[i]}`;
    if (!codeToId.get(chain)) {
      const top = chain.split('.')[0];
      const { type, rootType, reportType, nature } = mapType(top);
      const parentChain = chain.includes('.') ? chain.split('.').slice(0, -1).join('.') : null;
      const parentId = parentChain ? codeToId.get(parentChain) || null : null;
      const created = await Account.findOrCreate({
        where: { code: chain },
        defaults: {
          code: chain,
          name: chain,
          type, rootType, reportType,
          parentId,
          level: chain.split('.').length,
          isGroup: true,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          nature,
          accountType: chain.includes('.') ? 'sub' : 'main',
          description: 'Auto-created parent'
        },
        transaction: t
      });
      const id = (created && created[0] && created[0].id) ? created[0].id : (await Account.findOne({ where: { code: chain }, transaction: t }))?.id;
      codeToId.set(chain, id);
    }
  }
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    // Build current code->id map
    const [rows] = await sequelize.query('SELECT id, code FROM accounts', { transaction: t });
    const codeToId = new Map(rows.map(r => [r.code, r.id]));

    const toCreate = [...accounts].sort(byDepth);
    for (const a of toCreate) {
      await ensureChain(codeToId, a.code, t);
      const parentCode = a.code.split('.').slice(0, -1).join('.');
      const parentId = codeToId.get(parentCode) || null;
      const top = a.code.split('.')[0];
      const { type, rootType, reportType, nature } = mapType(top);
      const [acc] = await Account.findOrCreate({
        where: { code: a.code },
        defaults: {
          code: a.code,
          name: a.name,
          type, rootType, reportType,
          parentId,
          level: a.code.split('.').length,
          isGroup: false,
          isActive: true,
          balance: 0,
          currency: 'LYD',
          nature,
          accountType: 'sub',
          description: 'Shipping COA seed'
        },
        transaction: t
      });
      codeToId.set(a.code, acc.id);
    }

    await t.commit();
    console.log('✅ Seeded Shipping & International Sales COA items. Total added:', toCreate.length);
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Failed to seed shipping COA:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });