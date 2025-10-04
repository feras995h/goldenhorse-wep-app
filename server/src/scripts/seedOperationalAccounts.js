import 'dotenv/config';
import models, { sequelize } from '../models/index.js';
import { ensureOperationalSubAccounts } from '../utils/ensureDefaultAccounts.js';

async function main() {
  await sequelize.authenticate();
  try {
    const res = await ensureOperationalSubAccounts(models);
    console.log('✅ Operational sub-accounts ensured:', res);
  } catch (e) {
    console.error('❌ Failed to ensure operational accounts:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });