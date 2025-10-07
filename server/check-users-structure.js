import { Sequelize } from 'sequelize';
import config from './src/config/database.cjs';

async function checkUsersStructure() {
  try {
    const env = (process.env.NODE_ENV || 'development').trim().replace(/^=+/, '');
    const dbConfig = config[env];

    let sequelize;
    if (dbConfig.url) {
      sequelize = new Sequelize(dbConfig.url, { dialect: 'postgres', logging: false });
    } else {
      sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
          host: dbConfig.host,
          port: dbConfig.port,
          dialect: dbConfig.dialect,
          logging: false
        }
      );
    }

    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Users table structure:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersStructure();