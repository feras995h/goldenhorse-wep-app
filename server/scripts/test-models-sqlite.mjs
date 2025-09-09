import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Redirect console output to a logfile for reliable capture
import fsSync from 'fs';
const outFile = path.join(__dirname, 'test-models-output.log');
try { fsSync.writeFileSync(outFile, ''); } catch (e) {}
const origLog = console.log;
const origErr = console.error;
console.log = (...args) => {
  try { fsSync.appendFileSync(outFile, args.join(' ') + '\n'); } catch (e) {}
  origLog(...args);
};
console.error = (...args) => {
  try { fsSync.appendFileSync(outFile, args.join(' ') + '\n'); } catch (e) {}
  origErr(...args);
};

console.log('🔬 Running Sequelize model tests (sqlite memory)');

const sequelize = new Sequelize('sqlite::memory:', { logging: false });

// Import model factories
import AccountFactory from '../src/models/Account.js';
import UserFactory from '../src/models/User.js';
import JournalEntryFactory from '../src/models/JournalEntry.js';
import JournalEntryDetailFactory from '../src/models/JournalEntryDetail.js';

// Initialize models
const Account = AccountFactory(sequelize);
const User = UserFactory(sequelize);
const JournalEntry = JournalEntryFactory(sequelize);
const JournalEntryDetail = JournalEntryDetailFactory(sequelize);

// Setup associations if present
const models = { Account, User, JournalEntry, JournalEntryDetail };
Object.values(models).forEach(m => { if (m.associate) m.associate(models); });

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (sqlite memory)');

    // 1) User password hashing
    const user = await User.create({ username: 'tester', password: 'secret123', name: 'Test User', role: 'admin' });
    if (!user || !user.password) throw new Error('User not created properly');
    if (user.password === 'secret123') throw new Error('Password was not hashed');
    const ok = await user.comparePassword('secret123');
    console.log('User password hashing & compare:', ok ? 'PASS' : 'FAIL');

    // 2) Account creation & uniqueness
    const acc = await Account.create({ code: '1000', name: 'Cash', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet' });
    console.log('Account create PASS:', acc.code === '1000');

    let dupError = false;
    try {
      await Account.create({ code: '1000', name: 'Cash Duplicate', type: 'asset', rootType: 'Asset', reportType: 'Balance Sheet' });
    } catch (e) {
      dupError = true;
      console.log('Account uniqueness enforced:', true);
    }
    if (!dupError) console.log('Account uniqueness enforced: FAIL');

    // 3) JournalEntry balance hook (balanced)
    const je = await JournalEntry.create({ entryNumber: 'JE000001', date: new Date().toISOString().slice(0,10), totalDebit: 100.00, totalCredit: 100.00, description: 'Balanced entry' });
    console.log('JournalEntry balanced creation:', je ? 'PASS' : 'FAIL');

    // 4) JournalEntry unbalanced should fail
    let unbalancedFailed = false;
    try {
      await JournalEntry.create({ entryNumber: 'JE000002', date: new Date().toISOString().slice(0,10), totalDebit: 100.00, totalCredit: 50.00, description: 'Unbalanced entry' });
    } catch (e) {
      unbalancedFailed = true;
      console.log('JournalEntry unbalanced rejection:', true);
    }
    if (!unbalancedFailed) console.log('JournalEntry unbalanced rejection: FAIL');

    // 5) JournalEntryDetail validation
    // valid detail (debit)
    const detail = await JournalEntryDetail.create({ journalEntryId: je.id, accountId: acc.id, debit: 100.00, credit: 0, description: 'Detail debit' });
    console.log('JournalEntryDetail debit creation:', detail ? 'PASS' : 'FAIL');

    // invalid detail (both zero)
    let bothZeroFailed = false;
    try {
      await JournalEntryDetail.create({ journalEntryId: je.id, accountId: acc.id, debit: 0, credit: 0 });
    } catch (e) {
      bothZeroFailed = true;
      console.log('JournalEntryDetail zero amounts rejection:', true);
    }
    if (!bothZeroFailed) console.log('JournalEntryDetail zero amounts rejection: FAIL');

    // invalid detail (both positive)
    let bothPosFailed = false;
    try {
      await JournalEntryDetail.create({ journalEntryId: je.id, accountId: acc.id, debit: 10, credit: 5 });
    } catch (e) {
      bothPosFailed = true;
      console.log('JournalEntryDetail both amounts rejection:', true);
    }
    if (!bothPosFailed) console.log('JournalEntryDetail both amounts rejection: FAIL');

    console.log('\nAll model tests completed.');
  } catch (err) {
    console.error('Test script error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
