import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../models/index.js';

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  await sequelize.authenticate();
  const t = await sequelize.transaction();
  try {
    // Switch off FKs
    await sequelize.query('SET session_replication_role = replica;', { transaction: t });

    // Get tables except users and SequelizeMeta
    const [tables] = await sequelize.query(`
      SELECT tablename AS name
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN ('users','SequelizeMeta');
    `, { transaction: t });

    // Delete data from all tables except users
    for (const row of tables) {
      const name = row.name;
      await sequelize.query(`DELETE FROM "${name}";`, { transaction: t });
    }

    // Clean users except admin; reset admin password
    await sequelize.query("DELETE FROM users WHERE username <> 'admin'", { transaction: t });
    const hash = await bcrypt.hash(adminPassword, 12);
    await sequelize.query(
      "UPDATE users SET password = :pwd, name = 'مدير النظام', \"passwordChangedAt\" = NOW() WHERE username = 'admin'",
      { replacements: { pwd: hash }, transaction: t }
    );

    // Re-enable FKs
    await sequelize.query('SET session_replication_role = DEFAULT;', { transaction: t });

    await t.commit();
    console.log('✅ Purged all tables except users; kept admin with updated password');
    console.log('🔐 Admin credentials: admin / ' + adminPassword);
  } catch (e) {
    await t.rollback();
    console.error('❌ Purge failed:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });