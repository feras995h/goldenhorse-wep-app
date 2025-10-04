import 'dotenv/config';
import models, { sequelize } from '../models/index.js';
import depreciationScheduler from '../utils/depreciationScheduler.js';

const { User } = models;

function parseArgs(argv) {
  const args = { asOfDate: null, userId: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--asOfDate=')) args.asOfDate = a.split('=')[1];
    if (a.startsWith('--userId=')) args.userId = a.split('=')[1];
  }
  return args;
}

async function resolveUserId(passed) {
  if (passed) return passed;
  // Prefer a UUID-looking user id
  const [row] = await sequelize.query(
    "SELECT id FROM users WHERE id ~ '^[0-9a-fA-F-]{36}$' ORDER BY createdAt ASC LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  if (row?.id) return row.id;
  // fallback: try model, but may return integer IDs in inconsistent DBs
  const u = await User.findOne({ order: [['createdAt','ASC']] });
  return u?.id || null;
}

async function main() {
  const args = parseArgs(process.argv);
  await sequelize.authenticate();
  const userId = await resolveUserId(args.userId);
  if (!userId) {
    console.error('❌ No valid user id found; pass --userId=<uuid>');
    process.exit(1);
  }
  console.log('⏳ Running due depreciation...', { asOfDate: args.asOfDate || null, userId });
  const res = await depreciationScheduler.runDueDepreciation(userId, args.asOfDate || null);
  console.log('✅ Depreciation run result:\n', JSON.stringify(res, null, 2));
  await sequelize.close();
}

main().catch(err => {
  console.error('❌ Failed to run depreciation:', err);
  process.exit(1);
});
