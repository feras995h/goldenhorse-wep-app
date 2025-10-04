import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function main() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(`
    SELECT
      fa."assetNumber",
      fa.name,
      fa."categoryAccountId",
      a_cat.code AS category_code,
      a_asset.code AS asset_account_code,
      a_asset.name AS asset_account_name,
      a_accdep.code AS acc_dep_account_code,
      a_dep.code AS dep_exp_account_code
    FROM fixed_assets fa
    LEFT JOIN accounts a_cat ON a_cat.id = fa."categoryAccountId"
    LEFT JOIN accounts a_asset ON a_asset.id = fa."assetAccountId"
    LEFT JOIN accounts a_accdep ON a_accdep.id = fa."accumulatedDepreciationAccountId"
    LEFT JOIN accounts a_dep ON a_dep.id = fa."depreciationExpenseAccountId"
    ORDER BY fa."assetNumber" ASC
  `);
  console.log('📋 Fixed Asset Accounts Report');
  for (const r of rows) {
    console.log(`- ${r.assetNumber} | ${r.name} | Cat: ${r.category_code || '—'} | Asset: ${r.asset_account_code || '—'} | AccDep: ${r.acc_dep_account_code || '—'} | DepExp: ${r.dep_exp_account_code || '—'}`);
  }
  await sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });