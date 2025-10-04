import 'dotenv/config';
import models, { sequelize } from '../models/index.js';

const { FixedAsset } = models;

async function main() {
  await sequelize.authenticate();
  const assets = await FixedAsset.findAll({ order: [['assetNumber','ASC']] });
  let created = 0;
  for (const a of assets) {
    const [existing] = await sequelize.query(
      'SELECT COUNT(*)::int AS cnt FROM depreciation_schedules WHERE "fixedAssetId" = :id',
      { replacements: { id: a.id }, type: sequelize.QueryTypes.SELECT }
    );
    if ((existing?.cnt || 0) > 0) continue;
    try {
      const [res] = await sequelize.query(
        'SELECT generate_depreciation_schedule(:assetId) AS months_created',
        { replacements: { assetId: a.id }, type: sequelize.QueryTypes.SELECT }
      );
      created += res?.months_created || 0;
      console.log(`  ✓ Generated schedule for ${a.assetNumber} (${a.name}) -> months: ${res?.months_created || 0}`);
    } catch (e) {
      console.warn(`  ✗ Failed schedule for ${a.assetNumber}: ${e.message}`);
    }
  }
  console.log(`📈 Total months created across assets: ${created}`);
  await sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });