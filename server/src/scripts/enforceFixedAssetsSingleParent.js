import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { Account } = models;

async function ensureNames(t) {
  // Ensure proper Arabic names for 1.2 and 1.3
  await sequelize.query("UPDATE accounts SET name = 'الذمم' WHERE code = '1.2'", { transaction: t });
  await sequelize.query("UPDATE accounts SET name = 'الأصول الثابتة' WHERE code = '1.3'", { transaction: t });
}

async function main() {
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    // Ensure target parent (1.3) exists
    const [faParent] = await sequelize.query("SELECT id FROM accounts WHERE code = '1.3'", { type: sequelize.QueryTypes.SELECT, transaction: t });
    if (!faParent?.id) {
      throw new Error('Account 1.3 not found. Run coa:rebuild first.');
    }

    await ensureNames(t);

    // Find any account named like fixed assets but not code 1.3
    const [dups] = await sequelize.query(
      "SELECT id, code, name FROM accounts WHERE name IN ('الأصول الثابتة','اصل ثابت','أصول ثابتة') AND code <> '1.3'",
      { transaction: t }
    );

    for (const a of dups) {
      // Move children to 1.3
      await sequelize.query('UPDATE accounts SET "parentId" = :pid WHERE "parentId" = :oldId', { replacements: { pid: faParent.id, oldId: a.id }, transaction: t });
      // With empty data we can safely delete the duplicate
      await sequelize.query('DELETE FROM accounts WHERE id = :id', { replacements: { id: a.id }, transaction: t });
      console.log(`✓ Removed duplicate fixed-assets parent ${a.code} - ${a.name}`);
    }

    // Fix any account at level 1 with code like '12' that represents fixed assets
    const [flatFa] = await sequelize.query("SELECT id, code, name FROM accounts WHERE code = '12'", { transaction: t });
    for (const a of flatFa) {
      // Move children to 1.3 then delete
      await sequelize.query('UPDATE accounts SET "parentId" = :pid WHERE "parentId" = :oldId', { replacements: { pid: faParent.id, oldId: a.id }, transaction: t });
      await sequelize.query('DELETE FROM accounts WHERE id = :id', { replacements: { id: a.id }, transaction: t });
      console.log(`✓ Removed flat fixed-assets account ${a.code} - ${a.name}`);
    }

    await t.commit();
    console.log('✅ Enforced single fixed-assets parent (1.3)');
    await sequelize.close();
  } catch (e) {
    await t.rollback();
    console.error('❌ Enforcement failed:', e.message);
    await sequelize.close();
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });