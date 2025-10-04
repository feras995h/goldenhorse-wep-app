import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    const [accounts] = await sequelize.query('SELECT id, code, "parentId", level FROM accounts ORDER BY code', { transaction: t });

    // Build map code->id
    const codeToId = new Map(accounts.map(a => [a.code, a.id]));

    let fixes = 0;
    for (const a of accounts) {
      const parts = String(a.code).split('.');
      const desiredLevel = parts.length;
      const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : null;
      const desiredParentId = parentCode ? codeToId.get(parentCode) || null : null;
      const needsParentFix = (a.parentId || null) !== (desiredParentId || null);
      const needsLevelFix = (a.level || 0) !== desiredLevel;
      if (needsParentFix || needsLevelFix) {
        await sequelize.query(
          'UPDATE accounts SET "parentId" = :pid, level = :lvl WHERE id = :id',
          { replacements: { pid: desiredParentId, lvl: desiredLevel, id: a.id }, transaction: t }
        );
        fixes++;
      }
    }

    // Update isGroup: mark as group if has children
    const [childrenCount] = await sequelize.query(
      'SELECT "parentId" as id, COUNT(*)::int cnt FROM accounts WHERE "parentId" IS NOT NULL GROUP BY "parentId"',
      { transaction: t }
    );
    const hasChildren = new Set(childrenCount.filter(r => r.cnt > 0).map(r => r.id));

    const [allIds] = await sequelize.query('SELECT id FROM accounts', { transaction: t });
    let groupFixes = 0;
    for (const row of allIds) {
      const isGroup = hasChildren.has(row.id);
      await sequelize.query('UPDATE accounts SET "isGroup" = :g WHERE id = :id', { replacements: { g: isGroup, id: row.id }, transaction: t });
      groupFixes++;
    }

    await t.commit();
    console.log(`✅ Normalized account hierarchy. Parent/level fixes: ${fixes}, isGroup recalculated: ${groupFixes}`);
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Normalization failed:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });