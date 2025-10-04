import 'dotenv/config';
import models, { sequelize } from '../models/index.js';
import DepreciationService from '../services/depreciationService.js';

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
  const u = await User.findOne({ order: [['createdAt','ASC']] });
  return u?.id || null;
}

async function main() {
  const args = parseArgs(process.argv);
  await sequelize.authenticate();
  const userId = await resolveUserId(args.userId);
  if (!userId) {
    console.error('❌ No valid user id found; pass --userId=<id>');
    process.exit(1);
  }
  const date = args.asOfDate ? new Date(args.asOfDate) : new Date();
  console.log('⏳ Running local depreciation posting via service...', { date: date.toISOString().slice(0,10) });
  const res = await DepreciationService.calculateMonthlyDepreciation({ date, createdBy: userId });
  console.log('✅ Result:\n', JSON.stringify(res, null, 2));
  await sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });