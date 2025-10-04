import 'dotenv/config';
import models, { sequelize } from '../models/index.js';
import { ensureFixedAssetsStructure } from '../utils/fixedAssetHelpers.js';

const { Account, FixedAsset } = models;

function parseArgs(argv) {
  const args = { commit: false, dryRun: true, limit: 0 };
  for (const a of argv.slice(2)) {
    if (a === '--commit') { args.commit = true; args.dryRun = false; }
    else if (a === '--dry-run') { args.dryRun = true; args.commit = false; }
    else if (a.startsWith('--limit=')) { args.limit = parseInt(a.split('=')[1]) || 0; }
  }
  return args;
}

async function findOrCreateDefaultCategory() {
  // Ensure Fixed Assets parent exists (1.3)
  const { fixedAssetsParent } = await ensureFixedAssetsStructure();
  if (!fixedAssetsParent) throw new Error('Fixed Assets parent could not be ensured');

  // Try to find a non-group asset account under Fixed Assets as default category
  let category = await Account.findOne({
    where: {
      parentId: fixedAssetsParent.id,
      type: 'asset',
      isActive: true,
      isGroup: false
    },
    order: [['code','ASC']]
  });

  if (category) return category;

  // If none exists, create a default category
  category = await Account.create({
    code: '1.3.1',
    name: 'معدات وآلات',
    nameEn: 'Equipment & Machinery',
    type: 'asset',
    rootType: 'Asset',
    reportType: 'Balance Sheet',
    parentId: fixedAssetsParent.id,
    level: (fixedAssetsParent.level || 2) + 1,
    isGroup: false,
    isActive: true,
    balance: 0,
    currency: 'LYD',
    nature: 'debit',
    accountType: 'sub',
    description: 'Default fixed asset category'
  });
  return category;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log('🔧 Assign Fixed Asset Category — args:', args);

  // Connect
  await sequelize.authenticate();
  console.log('🗄️ Connected to database.');

  const category = await findOrCreateDefaultCategory();
  console.log(`📁 Default category: ${category.code} - ${category.name}`);

  // Fetch all assets and determine which need assignment
  const allAssets = await FixedAsset.findAll({ order: [['assetNumber','ASC']] });
  const needsAssignment = [];
  for (const a of allAssets) {
    const val = (a.categoryAccountId || '').toString().trim();
    let missing = !val || val === '';
    if (!missing && val) {
      // verify referenced account exists
      const exists = await Account.findByPk(val);
      missing = !exists;
    }
    if (missing) needsAssignment.push(a);
    if (args.limit && needsAssignment.length >= args.limit) break;
  }

  console.log(`🧾 Assets needing category assignment: ${needsAssignment.length}`);

  if (needsAssignment.length === 0) {
    await sequelize.close();
    console.log('✅ Nothing to assign.');
    process.exit(0);
  }

  if (args.dryRun) {
    for (const a of needsAssignment) {
      console.log(`  • Would set categoryAccountId=${category.id} (${category.code}) for ${a.assetNumber} (${a.name})`);
    }
    await sequelize.close();
    return;
  }

  const t = await sequelize.transaction();
  try {
    for (const a of needsAssignment) {
      await a.update({ categoryAccountId: category.id }, { transaction: t });
    }
    await t.commit();
    console.log(`✅ Assigned category to ${needsAssignment.length} assets`);
  } catch (e) {
    await t.rollback();
    console.error('❌ Failed assigning categories:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});