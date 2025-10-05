import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function checkGLJournals() {
  try {
    await sequelize.authenticate();
    console.log('Connected\n');

    // Check gl_journals columns
    console.log('=== gl_journals columns ===');
    const [glCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'gl_journals' ORDER BY column_name
    `);
    glCols.forEach(c => console.log(`  ${c.column_name}`));

    // Check posting_journal_entries columns
    console.log('\n=== posting_journal_entries columns ===');
    const [pjeCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'posting_journal_entries' ORDER BY column_name
    `);
    pjeCols.forEach(c => console.log(`  ${c.column_name}`));

    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkGLJournals();
