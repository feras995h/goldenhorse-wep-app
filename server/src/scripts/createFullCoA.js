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

const defs = [
  { code: '1', name: 'الأصول', isGroup: true },
  { code: '2', name: 'المصروفات', isGroup: true },
  { code: '3', name: 'الالتزامات', isGroup: true },
  { code: '4', name: 'حقوق الملكية', isGroup: true },
  { code: '5', name: 'الإيرادات', isGroup: true },
  { code: '1.1', name: 'الأصول المتداولة', isGroup: true },
  { code: '1.1.1', name: 'الصندوق' },
  { code: '1.1.2', name: 'المصرف' },
  { code: '1.1.3', name: 'العهدة النقدية' },
  { code: '1.1.4', name: 'مصروفات مدفوعة مقدماً' },
  { code: '1.1.5', name: 'المخزون' },
  { code: '1.2', name: 'الذمم', isGroup: true },
  { code: '1.2.1', name: 'ذمم العملاء' },
  { code: '1.2.2', name: 'ذمم أخرى' },
  { code: '1.3', name: 'الأصول الثابتة', isGroup: true },
  { code: '1.3.1', name: 'معدات وآلات', isGroup: true },
  { code: '1.3.1.001', name: 'معدات عامة' },
  { code: '1.3.2', name: 'سيارات', isGroup: true },
  { code: '1.3.2.001', name: 'مركبات' },
  { code: '1.3.3', name: 'أثاث وتجهيزات', isGroup: true },
  { code: '1.3.3.001', name: 'أثاث' },
  { code: '1.3.4', name: 'أجهزة الحاسب', isGroup: true },
  { code: '1.3.4.001', name: 'أجهزة كمبيوتر' },
  { code: '1.3.5', name: 'مجمع إهلاك الأصول الثابتة', isGroup: true },
  { code: '1.4', name: 'أصول أخرى', isGroup: true },
  { code: '1.4.1', name: 'ودائع وتأمينات' },
  { code: '1.4.2', name: 'سلف وعهد' },
  { code: '3.1', name: 'الالتزامات المتداولة', isGroup: true },
  { code: '3.1.1', name: 'ذمم الموردين' },
  { code: '3.1.2', name: 'مصروفات مستحقة' },
  { code: '3.1.3', name: 'ضرائب مستحقة' },
  { code: '3.1.4', name: 'إيرادات مؤجلة' },
  { code: '3.2', name: 'الالتزامات طويلة الأجل', isGroup: true },
  { code: '3.2.1', name: 'قروض طويلة الأجل' },
  { code: '4.1', name: 'رأس المال' },
  { code: '4.2', name: 'الأرباح المحتجزة' },
  { code: '4.3', name: 'صافي الربح/الخسارة الجاري' },
  { code: '5.1', name: 'إيرادات تشغيلية', isGroup: true },
  { code: '5.1.1', name: 'إيرادات التخزين' },
  { code: '5.1.2', name: 'إيرادات المناولة' },
  { code: '5.1.3', name: 'إيرادات الشحن' },
  { code: '5.1.4', name: 'إيرادات خدمات أخرى' },
  { code: '5.2', name: 'إيرادات غير تشغيلية', isGroup: true },
  { code: '2.1', name: 'مصروفات تشغيلية', isGroup: true },
  { code: '2.1.1', name: 'مصروف مشتريات' },
  { code: '2.1.2', name: 'مصروف نقل' },
  { code: '2.1.3', name: 'مصروف وقود' },
  { code: '2.1.4', name: 'مصروف إيجار' },
  { code: '2.1.5', name: 'مصروفات الإهلاك', isGroup: true },
  { code: '2.2', name: 'مصروفات رواتب', isGroup: true },
  { code: '2.2.1', name: 'رواتب' },
  { code: '2.2.2', name: 'أجور' },
  { code: '2.2.3', name: 'تأمينات اجتماعية' },
  { code: '2.3', name: 'مصروفات إدارية', isGroup: true },
  { code: '2.3.1', name: 'مستلزمات مكتبية' },
  { code: '2.3.2', name: 'مرافق (كهرباء/ماء)' },
  { code: '2.3.3', name: 'اتصالات' },
  { code: '2.4', name: 'تكلفة الخدمات', isGroup: true },
  { code: '2.4.1', name: 'تكلفة خدمات الشحن' },
  { code: '2.5', name: 'مصروفات أخرى', isGroup: true },
  { code: '2.5.1', name: 'عمولات بنكية' },
  { code: '2.5.2', name: 'خسائر فروق عملة' },
];

function byDepth(a, b) {
  const da = a.code.split('.').length;
  const db = b.code.split('.').length;
  if (da !== db) return da - db;
  return a.code.localeCompare(b.code);
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    await sequelize.query('DELETE FROM accounts', { transaction: t });

    const codeToId = new Map();
    const toCreate = [...defs].sort(byDepth);

    for (const d of toCreate) {
      const parts = d.code.split('.');
      const top = parts[0];
      const { type, rootType, reportType, nature } = mapType(top);
      const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : null;
      let parentId = null;
      if (parentCode) {
        parentId = codeToId.get(parentCode);
        if (!parentId) {
          let chain = '';
          for (let i = 0; i < parts.length - 1; i++) {
            chain = i === 0 ? parts[0] : `${chain}.${parts[i]}`;
            if (!codeToId.get(chain)) {
              const { type: ct, rootType: cr, reportType: rr, nature: nn } = mapType(chain.split('.')[0]);
              const parentChain = chain.includes('.') ? chain.split('.').slice(0, -1).join('.') : null;
              const pId = parentChain ? codeToId.get(parentChain) || null : null;
              const createdParent = await Account.create({
                code: chain,
                name: chain,
                type: ct,
                rootType: cr,
                reportType: rr,
                parentId: pId,
                level: chain.split('.').length,
                isGroup: true,
                isActive: true,
                balance: 0,
                currency: 'LYD',
                nature: nn,
                accountType: chain.includes('.') ? 'sub' : 'main',
                description: 'Auto-created parent'
              }, { transaction: t });
              codeToId.set(chain, createdParent.id);
            }
          }
          parentId = codeToId.get(parentCode) || null;
        }
      }

      const acc = await Account.create({
        code: d.code,
        name: d.name,
        type,
        rootType,
        reportType,
        parentId,
        level: parts.length,
        isGroup: !!d.isGroup,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature,
        accountType: parts.length === 1 ? 'main' : 'sub',
        description: 'Full COA seed'
      }, { transaction: t });
      codeToId.set(d.code, acc.id);
    }

    await t.commit();
    console.log('✅ Full Chart of Accounts created successfully. Total:', codeToId.size);
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Failed to create full COA:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
  switch (top) {
    case '1': return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
    case '2': return { type: 'expense', rootType: 'Expense', reportType: 'Profit and Loss', nature: 'debit' };
    case '3': return { type: 'liability', rootType: 'Liability', reportType: 'Balance Sheet', nature: 'credit' };
    case '4': return { type: 'equity', rootType: 'Equity', reportType: 'Balance Sheet', nature: 'credit' };
    case '5': return { type: 'revenue', rootType: 'Income', reportType: 'Profit and Loss', nature: 'credit' };
    default: return { type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet', nature: 'debit' };
  }
}

const defs = [
  // Main
  { code: '1', name: 'الأصول', isGroup: true },
  { code: '2', name: 'المصروفات', isGroup: true },
  { code: '3', name: 'الالتزامات', isGroup: true },
  { code: '4', name: 'حقوق الملكية', isGroup: true },
  { code: '5', name: 'الإيرادات', isGroup: true },

  // 1 الأصول
  { code: '1.1', name: 'الأصول المتداولة', isGroup: true },
  { code: '1.1.1', name: 'الصندوق' },
  { code: '1.1.2', name: 'المصرف' },
  { code: '1.1.3', name: 'العهدة النقدية' },
  { code: '1.1.4', name: 'مصروفات مدفوعة مقدماً' },
  { code: '1.1.5', name: 'المخزون' },

  { code: '1.2', name: 'الذمم', isGroup: true },
  { code: '1.2.1', name: 'ذمم العملاء' },
  { code: '1.2.2', name: 'ذمم أخرى' },

  { code: '1.3', name: 'الأصول الثابتة', isGroup: true },
  { code: '1.3.1', name: 'معدات وآلات', isGroup: true },
  { code: '1.3.1.001', name: 'معدات عامة' },
  { code: '1.3.2', name: 'سيارات', isGroup: true },
  { code: '1.3.2.001', name: 'مركبات' },
  { code: '1.3.3', name: 'أثاث وتجهيزات', isGroup: true },
  { code: '1.3.3.001', name: 'أثاث' },
  { code: '1.3.4', name: 'أجهزة الحاسب', isGroup: true },
  { code: '1.3.4.001', name: 'أجهزة كمبيوتر' },
  { code: '1.3.5', name: 'مجمع إهلاك الأصول الثابتة', isGroup: true },

  { code: '1.4', name: 'أصول أخرى', isGroup: true },
  { code: '1.4.1', name: 'ودائع وتأمينات' },
  { code: '1.4.2', name: 'سلف وعهد' },

  // 3 الالتزامات
  { code: '3.1', name: 'الالتزامات المتداولة', isGroup: true },
  { code: '3.1.1', name: 'ذمم الموردين' },
  { code: '3.1.2', name: 'مصروفات مستحقة' },
  { code: '3.1.3', name: 'ضرائب مستحقة' },
  { code: '3.1.4', name: 'إيرادات مؤجلة' },
  { code: '3.2', name: 'الالتزامات طويلة الأجل', isGroup: true },
  { code: '3.2.1', name: 'قروض طويلة الأجل' },

  // 4 حقوق الملكية
  { code: '4.1', name: 'رأس المال' },
  { code: '4.2', name: 'الأرباح المحتجزة' },
  { code: '4.3', name: 'صافي الربح/الخسارة الجاري' },

  // 5 الإيرادات
  { code: '5.1', name: 'إيرادات تشغيلية', isGroup: true },
  { code: '5.1.1', name: 'إيرادات التخزين' },
  { code: '5.1.2', name: 'إيرادات المناولة' },
  { code: '5.1.3', name: 'إيرادات الشحن' },
  { code: '5.1.4', name: 'إيرادات خدمات أخرى' },
  { code: '5.2', name: 'إيرادات غير تشغيلية', isGroup: true },

  // 2 المصروفات
  { code: '2.1', name: 'مصروفات تشغيلية', isGroup: true },
  { code: '2.1.1', name: 'مصروف مشتريات' },
  { code: '2.1.2', name: 'مصروف نقل' },
  { code: '2.1.3', name: 'مصروف وقود' },
  { code: '2.1.4', name: 'مصروف إيجار' },
  { code: '2.1.5', name: 'مصروفات الإهلاك', isGroup: true },

  { code: '2.2', name: 'مصروفات رواتب', isGroup: true },
  { code: '2.2.1', name: 'رواتب' },
  { code: '2.2.2', name: 'أجور' },
  { code: '2.2.3', name: 'تأمينات اجتماعية' },

  { code: '2.3', name: 'مصروفات إدارية', isGroup: true },
  { code: '2.3.1', name: 'مستلزمات مكتبية' },
  { code: '2.3.2', name: 'مرافق (كهرباء/ماء)' },
  { code: '2.3.3', name: 'اتصالات' },

  { code: '2.4', name: 'تكلفة الخدمات', isGroup: true },
  { code: '2.4.1', name: 'تكلفة خدمات الشحن' },

  { code: '2.5', name: 'مصروفات أخرى', isGroup: true },
  { code: '2.5.1', name: 'عمولات بنكية' },
  { code: '2.5.2', name: 'خسائر فروق عملة' },
];

function byDepth(a, b) {
  const da = a.code.split('.').length;
  const db = b.code.split('.').length;
  if (da !== db) return da - db;
  return a.code.localeCompare(b.code);
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    // Start from clean accounts
    await sequelize.query('DELETE FROM accounts', { transaction: t });

    const codeToId = new Map();
    const toCreate = [...defs].sort(byDepth);

    for (const d of toCreate) {
      const parts = d.code.split('.');
      const top = parts[0];
      const { type, rootType, reportType, nature } = mapType(top);
      const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : null;
      let parentId = null;
      if (parentCode) {
        parentId = codeToId.get(parentCode);
        if (!parentId) {
          // Create missing parent chain defensively
          let chain = '';
          for (let i = 0; i < parts.length - 1; i++) {
            chain = i === 0 ? parts[0] : `${chain}.${parts[i]}`;
            if (!codeToId.get(chain)) {
              const { type: ct, rootType: cr, reportType: rr, nature: nn } = mapType(chain.split('.')[0]);
              const parentChain = chain.includes('.') ? chain.split('.').slice(0, -1).join('.') : null;
              const pId = parentChain ? codeToId.get(parentChain) || null : null;
              const createdParent = await Account.create({
                code: chain,
                name: chain,
                type: ct,
                rootType: cr,
                reportType: rr,
                parentId: pId,
                level: chain.split('.').length,
                isGroup: true,
                isActive: true,
                balance: 0,
                currency: 'LYD',
                nature: nn,
                accountType: chain.includes('.') ? 'sub' : 'main',
                description: 'Auto-created parent'
              }, { transaction: t });
              codeToId.set(chain, createdParent.id);
            }
          }
          parentId = codeToId.get(parentCode) || null;
        }
      }

      const acc = await Account.create({
        code: d.code,
        name: d.name,
        type,
        rootType,
        reportType,
        parentId,
        level: parts.length,
        isGroup: !!d.isGroup,
        isActive: true,
        balance: 0,
        currency: 'LYD',
        nature,
        accountType: parts.length === 1 ? 'main' : 'sub',
        description: 'Full COA seed'
      }, { transaction: t });
      codeToId.set(d.code, acc.id);
    }

    await t.commit();
    console.log('✅ Full Chart of Accounts created successfully. Total:', codeToId.size);
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Failed to create full COA:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });